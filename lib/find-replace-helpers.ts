export type RegexFeatures = {
  allowZeroLength: boolean;
  hasStartAnchor: boolean;
  hasEndAnchor: boolean;
  usesWordBoundary: boolean;
  usesLookaround: boolean;
};

export const cloneRegex = (
  regex: RegExp | null,
  options: { forceGlobal?: boolean } = {},
): RegExp | null => {
  if (!regex) return null;
  const { forceGlobal = false } = options;
  const needsGlobal = forceGlobal && !regex.flags.includes("g");
  const flags = needsGlobal ? `${regex.flags}g` : regex.flags;
  return new RegExp(regex.source, flags);
};

export const analyzeRegexSource = (regex: RegExp): RegexFeatures => {
  const source = regex.source;
  let escaped = false;
  let inCharClass = false;
  let hasStartAnchor = false;
  let hasEndAnchor = false;
  let usesWordBoundary = false;
  let usesLookaround = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (escaped) {
      if (!inCharClass && (char === "b" || char === "B")) {
        usesWordBoundary = true;
      }
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === "[") {
      inCharClass = true;
      continue;
    }

    if (char === "]" && inCharClass) {
      inCharClass = false;
      continue;
    }

    if (inCharClass) {
      continue;
    }

    if (char === "^") {
      const prev = source[i - 1];
      if (
        i === 0 ||
        prev === "|" ||
        prev === "(" ||
        (prev === ":" && source[i - 2] === "?") ||
        (prev === "=" && source[i - 2] === "?") ||
        (prev === "!" && source[i - 2] === "?")
      ) {
        hasStartAnchor = true;
      }
      continue;
    }

    if (char === "$") {
      const next = source[i + 1];
      if (i === source.length - 1 || next === "|" || next === ")") {
        hasEndAnchor = true;
      }
      continue;
    }

    if (char === "(" && source[i + 1] === "?") {
      const lookType = source[i + 2];
      if (
        lookType === "=" ||
        lookType === "!" ||
        (lookType === "<" &&
          (source[i + 3] === "=" || source[i + 3] === "!"))
      ) {
        usesLookaround = true;
      }
    }
  }

  return {
    allowZeroLength:
      hasStartAnchor || hasEndAnchor || usesWordBoundary || usesLookaround,
    hasStartAnchor,
    hasEndAnchor,
    usesWordBoundary,
    usesLookaround,
  };
};

export const collectMatches = (
  text: string,
  regex: RegExp,
  allowZeroLength: boolean,
): RegExpExecArray[] => {
  const working = cloneRegex(regex, { forceGlobal: true });
  if (!working) return [];
  working.lastIndex = 0;
  const matches: RegExpExecArray[] = [];

  let match: RegExpExecArray | null;
  while ((match = working.exec(text)) !== null) {
    if (match[0].length === 0) {
      if (!allowZeroLength) {
        if (working.lastIndex <= match.index) {
          working.lastIndex = match.index + 1;
        }
        continue;
      }
      if (working.lastIndex <= match.index) {
        working.lastIndex = match.index + 1;
      }
    }
    matches.push(match);
  }

  return matches;
};

export const expandReplacement = (
  replacement: string,
  match: RegExpExecArray,
  original: string,
): string => {
  const captures = match.slice(1);
  const position = match.index ?? 0;
  const matched = match[0];
  const namedCaptures = match.groups ?? {};

  return replacement.replace(
    /\$([$&`']|\d{1,2}|<[^>]+>)/g,
    (fullMatch, indicator: string) => {
      switch (indicator) {
        case "$":
          return "$";
        case "&":
          return matched;
        case "`":
          return original.slice(0, position);
        case "'":
          return original.slice(position + matched.length);
        default:
          if (/^\d{1,2}$/.test(indicator)) {
            const groupIndex = Number.parseInt(indicator, 10);
            if (groupIndex === 0) {
              return matched;
            }
            return captures[groupIndex - 1] ?? "";
          }
          if (indicator.startsWith("<") && indicator.endsWith(">")) {
            const name = indicator.slice(1, -1);
            return namedCaptures?.[name] ?? "";
          }
          return fullMatch;
      }
    },
  );
};

export const applyRegexReplacement = (
  text: string,
  regex: RegExp,
  replacement: string,
  allowZeroLength: boolean,
): { result: string; changed: boolean } => {
  const working = cloneRegex(regex, { forceGlobal: true });
  if (!working) {
    return { result: text, changed: false };
  }
  working.lastIndex = 0;

  let result = "";
  let lastCursor = 0;
  let changed = false;
  let match: RegExpExecArray | null;

  while ((match = working.exec(text)) !== null) {
    const start = match.index ?? 0;
    const matchText = match[0];
    if (matchText.length === 0 && !allowZeroLength) {
      if (working.lastIndex <= start) {
        working.lastIndex = start + 1;
      }
      continue;
    }

    const end = start + matchText.length;
    result += text.slice(lastCursor, start);
    result += expandReplacement(replacement, match, text);
    lastCursor = end;
    changed = true;

    if (matchText.length === 0 && working.lastIndex <= start) {
      working.lastIndex = start + 1;
    }
  }

  if (!changed) {
    return { result: text, changed: false };
  }

  result += text.slice(lastCursor);
  return { result, changed: true };
};
