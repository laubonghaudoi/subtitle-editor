import { reorderSubtitleIds } from "@/lib/subtitle-operations";
import { secondsToTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";

export type SubtitleIssueSeverity = "error" | "warning" | "info";

export type SubtitleQualityRuleId =
  | "empty-cue"
  | "trim-whitespace"
  | "repeated-whitespace"
  | "repeated-word"
  | "invalid-duration"
  | "overlap"
  | "min-duration"
  | "max-duration"
  | "line-length"
  | "line-count"
  | "unbalanced-tags";

export interface SubtitleQualityOptions {
  minDurationSeconds: number;
  maxDurationSeconds: number;
  maxCharactersPerLine: number;
  maxLinesPerCue: number;
}

export type SubtitleIssueFix =
  | { kind: "delete" }
  | { kind: "text"; replacementText: string }
  | { kind: "timing"; startTime?: string; endTime?: string };

export interface SubtitleIssue {
  id: string;
  ruleId: SubtitleQualityRuleId;
  ruleLabel: string;
  subtitleUuid: string;
  subtitleId: number;
  severity: SubtitleIssueSeverity;
  message: string;
  fix?: SubtitleIssueFix;
}

export interface SubtitleFixRule {
  ruleId: SubtitleQualityRuleId;
  label: string;
  detect: (
    subtitles: Subtitle[],
    options: SubtitleQualityOptions,
  ) => SubtitleIssue[];
  apply?: (
    subtitles: Subtitle[],
    issue: SubtitleIssue,
    options: SubtitleQualityOptions,
  ) => Subtitle[];
}

export interface ApplySubtitleQualityFixesResult {
  subtitles: Subtitle[];
  appliedIssueIds: string[];
}

export const DEFAULT_SUBTITLE_QUALITY_OPTIONS: SubtitleQualityOptions = {
  minDurationSeconds: 1,
  maxDurationSeconds: 7,
  maxCharactersPerLine: 42,
  maxLinesPerCue: 2,
};

const clampNumber = (value: number, fallback: number, min: number) =>
  Number.isFinite(value) && value >= min ? value : fallback;

export function normalizeSubtitleQualityOptions(
  options: Partial<SubtitleQualityOptions> = {},
): SubtitleQualityOptions {
  const minDurationSeconds = clampNumber(
    options.minDurationSeconds ??
      DEFAULT_SUBTITLE_QUALITY_OPTIONS.minDurationSeconds,
    DEFAULT_SUBTITLE_QUALITY_OPTIONS.minDurationSeconds,
    0.1,
  );
  const maxDurationSeconds = Math.max(
    minDurationSeconds,
    clampNumber(
      options.maxDurationSeconds ??
        DEFAULT_SUBTITLE_QUALITY_OPTIONS.maxDurationSeconds,
      DEFAULT_SUBTITLE_QUALITY_OPTIONS.maxDurationSeconds,
      0.1,
    ),
  );

  return {
    minDurationSeconds,
    maxDurationSeconds,
    maxCharactersPerLine: Math.round(
      clampNumber(
        options.maxCharactersPerLine ??
          DEFAULT_SUBTITLE_QUALITY_OPTIONS.maxCharactersPerLine,
        DEFAULT_SUBTITLE_QUALITY_OPTIONS.maxCharactersPerLine,
        1,
      ),
    ),
    maxLinesPerCue: Math.round(
      clampNumber(
        options.maxLinesPerCue ??
          DEFAULT_SUBTITLE_QUALITY_OPTIONS.maxLinesPerCue,
        DEFAULT_SUBTITLE_QUALITY_OPTIONS.maxLinesPerCue,
        1,
      ),
    ),
  };
}

const issueId = (ruleId: SubtitleQualityRuleId, subtitle: Subtitle) =>
  `${ruleId}:${subtitle.uuid}`;

const makeIssue = (
  rule: Pick<SubtitleFixRule, "ruleId" | "label">,
  subtitle: Subtitle,
  severity: SubtitleIssueSeverity,
  message: string,
  fix?: SubtitleIssueFix,
): SubtitleIssue => ({
  id: issueId(rule.ruleId, subtitle),
  ruleId: rule.ruleId,
  ruleLabel: rule.label,
  subtitleUuid: subtitle.uuid,
  subtitleId: subtitle.id,
  severity,
  message,
  fix,
});

const updateSubtitleByUuid = (
  subtitles: Subtitle[],
  uuid: string,
  update: (subtitle: Subtitle, index: number) => Subtitle,
): Subtitle[] => {
  let changed = false;
  const updated = subtitles.map((subtitle, index) => {
    if (subtitle.uuid !== uuid) {
      return subtitle;
    }
    const next = update(subtitle, index);
    if (next !== subtitle) {
      changed = true;
    }
    return next;
  });
  return changed ? updated : subtitles;
};

const deleteSubtitleByUuid = (subtitles: Subtitle[], uuid: string) => {
  const next = subtitles.filter((subtitle) => subtitle.uuid !== uuid);
  return next.length === subtitles.length
    ? subtitles
    : reorderSubtitleIds(next);
};

const applyTextFix = (subtitles: Subtitle[], issue: SubtitleIssue) => {
  const fix = issue.fix;
  if (!fix || fix.kind !== "text") {
    return subtitles;
  }
  return updateSubtitleByUuid(subtitles, issue.subtitleUuid, (subtitle) => {
    if (subtitle.text === fix.replacementText) {
      return subtitle;
    }
    return { ...subtitle, text: fix.replacementText };
  });
};

const applyTimingFix = (subtitles: Subtitle[], issue: SubtitleIssue) => {
  const fix = issue.fix;
  if (!fix || fix.kind !== "timing") {
    return subtitles;
  }
  return updateSubtitleByUuid(subtitles, issue.subtitleUuid, (subtitle) => {
    const startTime = fix.startTime ?? subtitle.startTime;
    const endTime = fix.endTime ?? subtitle.endTime;
    if (subtitle.startTime === startTime && subtitle.endTime === endTime) {
      return subtitle;
    }
    return { ...subtitle, startTime, endTime };
  });
};

const countCharacters = (text: string) => Array.from(text).length;

const normalizeRepeatedWhitespace = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/[^\S\r\n]{2,}/gu, " "))
    .join("\n");

const REPEATED_WORD_REGEX = /\b([\p{L}\p{N}][\p{L}\p{N}'-]*)\b\s+\1\b/giu;

const normalizeRepeatedWords = (text: string) => {
  let next = text;
  for (let pass = 0; pass < 8; pass += 1) {
    const replaced = next.replace(REPEATED_WORD_REGEX, "$1");
    if (replaced === next) {
      return next;
    }
    next = replaced;
  }
  return next;
};

const wrapLineToLength = (line: string, maxCharacters: number) => {
  const words = line.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) {
    return line.trim();
  }

  const wrapped: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      current = word;
      continue;
    }
    if (countCharacters(`${current} ${word}`) <= maxCharacters) {
      current = `${current} ${word}`;
      continue;
    }
    wrapped.push(current);
    current = word;
  }

  if (current.length > 0) {
    wrapped.push(current);
  }

  return wrapped.join("\n");
};

const wrapTextToLineLength = (text: string, maxCharacters: number) =>
  text
    .split(/\r?\n/)
    .map((line) =>
      countCharacters(line) > maxCharacters
        ? wrapLineToLength(line, maxCharacters)
        : line,
    )
    .join("\n");

const rebalanceTextToLineCount = (text: string, maxLines: number) => {
  const words = text.replace(/\s+/gu, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) {
    return text.trim();
  }

  const totalCharacters = words.reduce(
    (total, word) => total + countCharacters(word),
    0,
  );
  const targetCharacters = Math.max(
    1,
    Math.ceil((totalCharacters + words.length - 1) / maxLines),
  );
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      current = word;
      continue;
    }
    if (
      lines.length < maxLines - 1 &&
      countCharacters(`${current} ${word}`) > targetCharacters
    ) {
      lines.push(current);
      current = word;
      continue;
    }
    current = `${current} ${word}`;
  }

  if (current.length > 0) {
    lines.push(current);
  }

  return lines
    .slice(0, maxLines - 1)
    .concat(lines.slice(maxLines - 1).join(" "))
    .join("\n");
};

const hasUnbalancedBasicTags = (text: string) => {
  const stack: string[] = [];
  let hasMismatch = false;
  const tagRegex = /<\/?([ibu])>/giu;
  for (const match of text.matchAll(tagRegex)) {
    const fullTag = match[0].toLowerCase();
    const tagName = match[1].toLowerCase();
    if (fullTag.startsWith("</")) {
      if (stack[stack.length - 1] === tagName) {
        stack.pop();
      } else {
        hasMismatch = true;
      }
    } else {
      stack.push(tagName);
    }
  }
  return hasMismatch || stack.length > 0;
};

const emptyCueRule: SubtitleFixRule = {
  ruleId: "empty-cue",
  label: "Empty cue",
  detect: (subtitles) =>
    subtitles
      .filter((subtitle) => subtitle.text.trim().length === 0)
      .map((subtitle) =>
        makeIssue(
          emptyCueRule,
          subtitle,
          "warning",
          "Cue text is empty or only whitespace.",
          { kind: "delete" },
        ),
      ),
  apply: (subtitles, issue) =>
    deleteSubtitleByUuid(subtitles, issue.subtitleUuid),
};

const trimWhitespaceRule: SubtitleFixRule = {
  ruleId: "trim-whitespace",
  label: "Trim whitespace",
  detect: (subtitles) =>
    subtitles.flatMap((subtitle) => {
      const replacementText = subtitle.text.trim();
      if (
        replacementText === subtitle.text ||
        subtitle.text.trim().length === 0
      ) {
        return [];
      }
      return [
        makeIssue(
          trimWhitespaceRule,
          subtitle,
          "info",
          "Cue text has leading or trailing whitespace.",
          { kind: "text", replacementText },
        ),
      ];
    }),
  apply: applyTextFix,
};

const repeatedWhitespaceRule: SubtitleFixRule = {
  ruleId: "repeated-whitespace",
  label: "Repeated whitespace",
  detect: (subtitles) =>
    subtitles.flatMap((subtitle) => {
      const replacementText = normalizeRepeatedWhitespace(subtitle.text);
      if (replacementText === subtitle.text) {
        return [];
      }
      return [
        makeIssue(
          repeatedWhitespaceRule,
          subtitle,
          "info",
          "Cue text has repeated spaces or tabs.",
          { kind: "text", replacementText },
        ),
      ];
    }),
  apply: applyTextFix,
};

const repeatedWordRule: SubtitleFixRule = {
  ruleId: "repeated-word",
  label: "Repeated word",
  detect: (subtitles) =>
    subtitles.flatMap((subtitle) => {
      const replacementText = normalizeRepeatedWords(subtitle.text);
      if (replacementText === subtitle.text) {
        return [];
      }
      return [
        makeIssue(
          repeatedWordRule,
          subtitle,
          "info",
          "Cue text has consecutive repeated words.",
          { kind: "text", replacementText },
        ),
      ];
    }),
  apply: applyTextFix,
};

const invalidDurationRule: SubtitleFixRule = {
  ruleId: "invalid-duration",
  label: "Invalid duration",
  detect: (subtitles, options) =>
    subtitles.flatMap((subtitle) => {
      const startSeconds = timeToSeconds(subtitle.startTime);
      const endSeconds = timeToSeconds(subtitle.endTime);
      if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
        return [
          makeIssue(
            invalidDurationRule,
            subtitle,
            "error",
            "Cue has an invalid timestamp.",
          ),
        ];
      }
      if (endSeconds > startSeconds) {
        return [];
      }
      return [
        makeIssue(
          invalidDurationRule,
          subtitle,
          "error",
          "Cue end time is earlier than or equal to the start time.",
          {
            kind: "timing",
            endTime: secondsToTime(startSeconds + options.minDurationSeconds),
          },
        ),
      ];
    }),
  apply: applyTimingFix,
};

const overlapRule: SubtitleFixRule = {
  ruleId: "overlap",
  label: "Overlap",
  detect: (subtitles, options) =>
    subtitles.flatMap((subtitle, index) => {
      if (index === 0) {
        return [];
      }
      const previous = subtitles[index - 1];
      const previousEnd = timeToSeconds(previous.endTime);
      const startSeconds = timeToSeconds(subtitle.startTime);
      const endSeconds = timeToSeconds(subtitle.endTime);
      if (
        !Number.isFinite(previousEnd) ||
        !Number.isFinite(startSeconds) ||
        !Number.isFinite(endSeconds) ||
        startSeconds >= previousEnd
      ) {
        return [];
      }
      return [
        makeIssue(
          overlapRule,
          subtitle,
          "error",
          `Cue overlaps the previous cue by ${(previousEnd - startSeconds).toFixed(3)}s.`,
          {
            kind: "timing",
            startTime: secondsToTime(previousEnd),
            endTime: secondsToTime(
              Math.max(endSeconds, previousEnd + options.minDurationSeconds),
            ),
          },
        ),
      ];
    }),
  apply: applyTimingFix,
};

const minDurationRule: SubtitleFixRule = {
  ruleId: "min-duration",
  label: "Minimum duration",
  detect: (subtitles, options) =>
    subtitles.flatMap((subtitle) => {
      const startSeconds = timeToSeconds(subtitle.startTime);
      const endSeconds = timeToSeconds(subtitle.endTime);
      const duration = endSeconds - startSeconds;
      if (
        !Number.isFinite(duration) ||
        duration <= 0 ||
        duration >= options.minDurationSeconds
      ) {
        return [];
      }
      return [
        makeIssue(
          minDurationRule,
          subtitle,
          "warning",
          `Cue duration is below ${options.minDurationSeconds.toFixed(1)}s.`,
          {
            kind: "timing",
            endTime: secondsToTime(startSeconds + options.minDurationSeconds),
          },
        ),
      ];
    }),
  apply: applyTimingFix,
};

const maxDurationRule: SubtitleFixRule = {
  ruleId: "max-duration",
  label: "Maximum duration",
  detect: (subtitles, options) =>
    subtitles.flatMap((subtitle) => {
      const startSeconds = timeToSeconds(subtitle.startTime);
      const endSeconds = timeToSeconds(subtitle.endTime);
      const duration = endSeconds - startSeconds;
      if (
        !Number.isFinite(duration) ||
        duration <= options.maxDurationSeconds
      ) {
        return [];
      }
      return [
        makeIssue(
          maxDurationRule,
          subtitle,
          "warning",
          `Cue duration is above ${options.maxDurationSeconds.toFixed(1)}s.`,
          {
            kind: "timing",
            endTime: secondsToTime(startSeconds + options.maxDurationSeconds),
          },
        ),
      ];
    }),
  apply: applyTimingFix,
};

const lineLengthRule: SubtitleFixRule = {
  ruleId: "line-length",
  label: "Line length",
  detect: (subtitles, options) =>
    subtitles.flatMap((subtitle) => {
      const lines = subtitle.text.split(/\r?\n/);
      const hasLongLine = lines.some(
        (line) => countCharacters(line) > options.maxCharactersPerLine,
      );
      if (!hasLongLine) {
        return [];
      }
      const replacementText = wrapTextToLineLength(
        subtitle.text,
        options.maxCharactersPerLine,
      );
      return [
        makeIssue(
          lineLengthRule,
          subtitle,
          "warning",
          `Cue has a line over ${options.maxCharactersPerLine} characters.`,
          replacementText !== subtitle.text
            ? { kind: "text", replacementText }
            : undefined,
        ),
      ];
    }),
  apply: applyTextFix,
};

const lineCountRule: SubtitleFixRule = {
  ruleId: "line-count",
  label: "Line count",
  detect: (subtitles, options) =>
    subtitles.flatMap((subtitle) => {
      const lines = subtitle.text.split(/\r?\n/);
      if (lines.length <= options.maxLinesPerCue) {
        return [];
      }
      const replacementText = rebalanceTextToLineCount(
        subtitle.text,
        options.maxLinesPerCue,
      );
      return [
        makeIssue(
          lineCountRule,
          subtitle,
          "warning",
          `Cue has more than ${options.maxLinesPerCue} lines.`,
          replacementText !== subtitle.text
            ? { kind: "text", replacementText }
            : undefined,
        ),
      ];
    }),
  apply: applyTextFix,
};

const unbalancedTagsRule: SubtitleFixRule = {
  ruleId: "unbalanced-tags",
  label: "Unbalanced tags",
  detect: (subtitles) =>
    subtitles
      .filter((subtitle) => hasUnbalancedBasicTags(subtitle.text))
      .map((subtitle) =>
        makeIssue(
          unbalancedTagsRule,
          subtitle,
          "warning",
          "Cue has unbalanced <i>, <b>, or <u> tags.",
        ),
      ),
};

const RULES: SubtitleFixRule[] = [
  emptyCueRule,
  trimWhitespaceRule,
  repeatedWhitespaceRule,
  repeatedWordRule,
  invalidDurationRule,
  overlapRule,
  minDurationRule,
  maxDurationRule,
  lineLengthRule,
  lineCountRule,
  unbalancedTagsRule,
];

export const SUBTITLE_QUALITY_RULES = RULES.map(({ ruleId, label }) => ({
  ruleId,
  label,
}));

export function analyzeSubtitleQuality(
  subtitles: Subtitle[],
  options: Partial<SubtitleQualityOptions> = {},
): SubtitleIssue[] {
  const normalizedOptions = normalizeSubtitleQualityOptions(options);
  return RULES.flatMap((rule) => rule.detect(subtitles, normalizedOptions));
}

export function applySubtitleQualityFixes(
  subtitles: Subtitle[],
  issues: SubtitleIssue[],
  options: Partial<SubtitleQualityOptions> = {},
): ApplySubtitleQualityFixesResult {
  const normalizedOptions = normalizeSubtitleQualityOptions(options);
  const selectedIssueIds = new Set(issues.map((issue) => issue.id));
  const appliedIssueIds: string[] = [];
  let nextSubtitles = subtitles;

  for (const rule of RULES) {
    if (!rule.apply) {
      continue;
    }
    const currentIssues = rule
      .detect(nextSubtitles, normalizedOptions)
      .filter((issue) => selectedIssueIds.has(issue.id) && issue.fix);

    for (const issue of currentIssues) {
      const updated = rule.apply(nextSubtitles, issue, normalizedOptions);
      if (updated !== nextSubtitles) {
        nextSubtitles = updated;
        appliedIssueIds.push(issue.id);
      }
    }
  }

  return {
    subtitles: appliedIssueIds.length > 0 ? nextSubtitles : subtitles,
    appliedIssueIds,
  };
}
