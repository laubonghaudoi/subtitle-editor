"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useSubtitleActionsContext,
  useSubtitleState,
  useSubtitles,
} from "@/context/subtitle-context";
import {
  analyzeSubtitleQuality,
  applySubtitleQualityFixes,
  DEFAULT_SUBTITLE_QUALITY_OPTIONS,
  SUBTITLE_QUALITY_RULES,
  normalizeSubtitleQualityOptions,
  type SubtitleIssue,
  type SubtitleIssueSeverity,
  type SubtitleQualityOptions,
  type SubtitleQualityRuleId,
} from "@/lib/subtitle-quality";
import {
  getReadableTextColor,
  getTrackColor,
  getTrackHandleColor,
} from "@/lib/track-colors";
import { cn } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  IconAlertTriangle,
  IconChecks,
  IconFilter,
  IconShieldCheck,
  IconTool,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

const SEVERITIES: SubtitleIssueSeverity[] = ["error", "warning", "info"];

const severityClasses: Record<SubtitleIssueSeverity, string> = {
  error:
    "border-red-600 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950/40 dark:text-red-200",
  warning:
    "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100",
  info: "border-sky-500 bg-sky-50 text-sky-800 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-100",
};

const coerceCheckedState = (checked: CheckedState) =>
  checked === "indeterminate" ? true : Boolean(checked);

const formatTiming = (subtitle: Subtitle) =>
  `${subtitle.startTime} -> ${subtitle.endTime}`;

const getIssueFixLabel = (
  issue: SubtitleIssue,
  t: ReturnType<typeof useTranslations>,
) => {
  if (!issue.fix) {
    return t("subtitleQuality.manualReview");
  }
  if (issue.fix.kind === "delete") {
    return t("subtitleQuality.deleteCue");
  }
  if (issue.fix.kind === "timing") {
    return t("subtitleQuality.timingFix");
  }
  return t("subtitleQuality.textFix");
};

const renderPreview = (
  issue: SubtitleIssue,
  subtitle: Subtitle | undefined,
  t: ReturnType<typeof useTranslations>,
) => {
  if (!subtitle) {
    return null;
  }
  if (!issue.fix) {
    return (
      <span className="text-muted-foreground">
        {t("subtitleQuality.manualReview")}
      </span>
    );
  }
  if (issue.fix.kind === "delete") {
    return (
      <span className="font-medium text-red-700 dark:text-red-300">
        {t("subtitleQuality.deleteCue")}
      </span>
    );
  }
  if (issue.fix.kind === "timing") {
    return (
      <div className="font-mono text-xs">
        {issue.fix.startTime ?? subtitle.startTime}
        {" -> "}
        {issue.fix.endTime ?? subtitle.endTime}
      </div>
    );
  }
  return (
    <span className="whitespace-pre-wrap">{issue.fix.replacementText}</span>
  );
};

type ThresholdInputProps = {
  id: string;
  label: string;
  value: number;
  min: number;
  step: number;
  onChange: (value: number) => void;
};

function ThresholdInput({
  id,
  label,
  value,
  min,
  step,
  onChange,
}: ThresholdInputProps) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
        className="h-8 rounded-xs px-2 text-sm"
      />
    </div>
  );
}

export default function SubtitleQuality() {
  const t = useTranslations();
  const subtitles = useSubtitles();
  const { replaceAllSubtitlesAction } = useSubtitleActionsContext();
  const { activeTrack, tracks } = useSubtitleState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qualityOptions, setQualityOptions] = useState<SubtitleQualityOptions>(
    DEFAULT_SUBTITLE_QUALITY_OPTIONS,
  );
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(
    new Set(),
  );
  const [enabledSeverities, setEnabledSeverities] = useState<
    Set<SubtitleIssueSeverity>
  >(new Set(SEVERITIES));
  const [enabledRuleIds, setEnabledRuleIds] = useState<
    Set<SubtitleQualityRuleId>
  >(new Set(SUBTITLE_QUALITY_RULES.map((rule) => rule.ruleId)));

  const issues = useMemo(
    () => analyzeSubtitleQuality(subtitles, qualityOptions),
    [subtitles, qualityOptions],
  );

  const filteredIssues = useMemo(
    () =>
      issues.filter(
        (issue) =>
          enabledSeverities.has(issue.severity) &&
          enabledRuleIds.has(issue.ruleId),
      ),
    [issues, enabledSeverities, enabledRuleIds],
  );

  const subtitlesByUuid = useMemo(
    () => new Map(subtitles.map((subtitle) => [subtitle.uuid, subtitle])),
    [subtitles],
  );

  const fixableFilteredIssues = filteredIssues.filter((issue) => issue.fix);
  const fixableIssueIds = new Set(
    fixableFilteredIssues.map((issue) => issue.id),
  );
  const selectedVisibleFixCount = fixableFilteredIssues.filter((issue) =>
    selectedIssueIds.has(issue.id),
  ).length;
  const allVisibleFixesSelected =
    fixableFilteredIssues.length > 0 &&
    selectedVisibleFixCount === fixableFilteredIssues.length;
  const headerCheckboxState: CheckedState = allVisibleFixesSelected
    ? true
    : selectedVisibleFixCount > 0
      ? "indeterminate"
      : false;

  const activeTrackIndex = activeTrack
    ? tracks.findIndex((track) => track.id === activeTrack.id)
    : -1;
  const normalizedTrackIndex = activeTrackIndex >= 0 ? activeTrackIndex : 0;
  const trackHandleColor = getTrackHandleColor(normalizedTrackIndex);
  const trackBackgroundColor = getTrackColor(normalizedTrackIndex, 0.12);
  const trackTextColor = getReadableTextColor(trackHandleColor);
  const isDisabled = !activeTrack || subtitles.length === 0;
  const trackName =
    activeTrack?.name ??
    tracks[0]?.name ??
    t("subtitle.newTrackName", { number: 1 });

  useEffect(() => {
    if (!isDialogOpen) {
      return;
    }
    const issueIds = new Set(issues.map((issue) => issue.id));
    setSelectedIssueIds((previous) => {
      const next = new Set([...previous].filter((id) => issueIds.has(id)));
      return next;
    });
  }, [isDialogOpen, issues]);

  const updateQualityOption = (
    key: keyof SubtitleQualityOptions,
    value: number,
  ) => {
    setQualityOptions((previous) =>
      normalizeSubtitleQualityOptions({
        ...previous,
        [key]: Number.isFinite(value) ? value : previous[key],
      }),
    );
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      const nextIssues = analyzeSubtitleQuality(subtitles, qualityOptions);
      setSelectedIssueIds(
        new Set(
          nextIssues.filter((issue) => issue.fix).map((issue) => issue.id),
        ),
      );
    }
  };

  const toggleSeverity = (severity: SubtitleIssueSeverity) => {
    setEnabledSeverities((previous) => {
      const next = new Set(previous);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next;
    });
  };

  const toggleRule = (ruleId: SubtitleQualityRuleId, enabled: boolean) => {
    setEnabledRuleIds((previous) => {
      const next = new Set(previous);
      if (enabled) {
        next.add(ruleId);
      } else {
        next.delete(ruleId);
      }
      return next;
    });
  };

  const handleToggleAllVisible = (checked: CheckedState) => {
    const shouldSelect = coerceCheckedState(checked);
    setSelectedIssueIds((previous) => {
      const next = new Set(previous);
      for (const id of fixableIssueIds) {
        if (shouldSelect) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  };

  const handleToggleIssue = (issueId: string, checked: CheckedState) => {
    setSelectedIssueIds((previous) => {
      const next = new Set(previous);
      if (coerceCheckedState(checked)) {
        next.add(issueId);
      } else {
        next.delete(issueId);
      }
      return next;
    });
  };

  const handleApply = () => {
    const selectedIssues = issues.filter(
      (issue) => selectedIssueIds.has(issue.id) && issue.fix,
    );
    if (selectedIssues.length === 0) {
      return;
    }
    const result = applySubtitleQualityFixes(
      subtitles,
      selectedIssues,
      qualityOptions,
    );
    if (result.appliedIssueIds.length === 0) {
      return;
    }
    replaceAllSubtitlesAction(result.subtitles);
    setSelectedIssueIds(new Set());
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-xs cursor-pointer border-black dark:border-white"
                disabled={isDisabled}
              >
                <IconShieldCheck />
                <span>{t("subtitleQuality.title")}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{t("subtitleQuality.tooltip")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {t("subtitleQuality.dialogTitle", { track: trackName })}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div
            className="grid gap-3 border-l-4 px-4 py-3"
            style={{
              borderColor: trackHandleColor,
              backgroundColor: trackBackgroundColor,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <IconChecks
                  className="size-4"
                  style={{ color: trackHandleColor }}
                />
                <span>
                  {t("subtitleQuality.summary", {
                    issues: issues.length,
                    selected: selectedIssueIds.size,
                    fixable: issues.filter((issue) => issue.fix).length,
                  })}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SEVERITIES.map((severity) => (
                  <Button
                    key={severity}
                    type="button"
                    size="sm"
                    variant={
                      enabledSeverities.has(severity) ? "default" : "outline"
                    }
                    aria-pressed={enabledSeverities.has(severity)}
                    className={cn(
                      "h-8 rounded-xs px-2 capitalize",
                      enabledSeverities.has(severity) && "shadow-none",
                    )}
                    onClick={() => toggleSeverity(severity)}
                  >
                    {t(`subtitleQuality.severity.${severity}`)}
                  </Button>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-xs"
                    >
                      <IconFilter />
                      {t("subtitleQuality.rules")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {t("subtitleQuality.rules")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {SUBTITLE_QUALITY_RULES.map((rule) => (
                      <DropdownMenuCheckboxItem
                        key={rule.ruleId}
                        checked={enabledRuleIds.has(rule.ruleId)}
                        onSelect={(event) => event.preventDefault()}
                        onCheckedChange={(checked) =>
                          toggleRule(rule.ruleId, checked)
                        }
                      >
                        {rule.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <ThresholdInput
                id="quality-min-duration"
                label={t("subtitleQuality.minDuration")}
                value={qualityOptions.minDurationSeconds}
                min={0.1}
                step={0.1}
                onChange={(value) =>
                  updateQualityOption("minDurationSeconds", value)
                }
              />
              <ThresholdInput
                id="quality-max-duration"
                label={t("subtitleQuality.maxDuration")}
                value={qualityOptions.maxDurationSeconds}
                min={0.1}
                step={0.1}
                onChange={(value) =>
                  updateQualityOption("maxDurationSeconds", value)
                }
              />
              <ThresholdInput
                id="quality-max-chars"
                label={t("subtitleQuality.maxChars")}
                value={qualityOptions.maxCharactersPerLine}
                min={1}
                step={1}
                onChange={(value) =>
                  updateQualityOption("maxCharactersPerLine", value)
                }
              />
              <ThresholdInput
                id="quality-max-lines"
                label={t("subtitleQuality.maxLines")}
                value={qualityOptions.maxLinesPerCue}
                min={1}
                step={1}
                onChange={(value) =>
                  updateQualityOption("maxLinesPerCue", value)
                }
              />
            </div>
          </div>

          <Table
            containerClassName="max-h-[34rem] overflow-y-auto border"
            className="w-full border-collapse text-sm"
          >
            <TableHeader>
              <TableRow>
                <TableHead
                  className="sticky top-0 z-20 w-10 border-b bg-background text-center"
                  style={{
                    backgroundColor: trackHandleColor,
                    color: trackTextColor,
                  }}
                >
                  <Checkbox
                    checked={headerCheckboxState}
                    disabled={fixableFilteredIssues.length === 0}
                    onCheckedChange={handleToggleAllVisible}
                    aria-label={t("subtitleQuality.selectVisible")}
                  />
                </TableHead>
                <TableHead
                  className="sticky top-0 z-20 w-16 border-b bg-background"
                  style={{
                    backgroundColor: trackHandleColor,
                    color: trackTextColor,
                  }}
                >
                  {t("subtitleQuality.cue")}
                </TableHead>
                <TableHead
                  className="sticky top-0 z-20 w-36 border-b bg-background"
                  style={{
                    backgroundColor: trackHandleColor,
                    color: trackTextColor,
                  }}
                >
                  {t("subtitleQuality.issue")}
                </TableHead>
                <TableHead
                  className="sticky top-0 z-20 border-b bg-background"
                  style={{
                    backgroundColor: trackHandleColor,
                    color: trackTextColor,
                  }}
                >
                  {t("subtitleQuality.original")}
                </TableHead>
                <TableHead
                  className="sticky top-0 z-20 border-b bg-background"
                  style={{
                    backgroundColor: trackHandleColor,
                    color: trackTextColor,
                  }}
                >
                  {t("subtitleQuality.preview")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => {
                  const subtitle = subtitlesByUuid.get(issue.subtitleUuid);
                  const isFixable = Boolean(issue.fix);
                  return (
                    <TableRow
                      key={issue.id}
                      className="border-b border-dashed hover:bg-muted/50"
                    >
                      <TableCell className="text-center align-top">
                        <Checkbox
                          checked={selectedIssueIds.has(issue.id)}
                          disabled={!isFixable}
                          onCheckedChange={(checked) =>
                            handleToggleIssue(issue.id, checked)
                          }
                          aria-label={t("subtitleQuality.selectIssue", {
                            id: issue.subtitleId,
                          })}
                        />
                      </TableCell>
                      <TableCell className="align-top font-mono text-xs">
                        #{issue.subtitleId}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="grid gap-1">
                          <span
                            className={cn(
                              "w-fit rounded-xs border px-2 py-0.5 text-xs font-medium capitalize",
                              severityClasses[issue.severity],
                            )}
                          >
                            {t(`subtitleQuality.severity.${issue.severity}`)}
                          </span>
                          <span className="font-medium">{issue.ruleLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {issue.message}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="grid gap-1">
                          {subtitle && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {formatTiming(subtitle)}
                            </span>
                          )}
                          <span className="whitespace-pre-wrap break-words">
                            {subtitle?.text}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="grid gap-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getIssueFixLabel(issue, t)}
                          </span>
                          {renderPreview(issue, subtitle, t)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <IconAlertTriangle className="size-4" />
                      {issues.length === 0
                        ? t("subtitleQuality.noIssues")
                        : t("subtitleQuality.noFilteredIssues")}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xs"
            onClick={() =>
              setSelectedIssueIds(
                new Set(
                  issues.filter((issue) => issue.fix).map((issue) => issue.id),
                ),
              )
            }
            disabled={issues.every((issue) => !issue.fix)}
          >
            <IconChecks />
            {t("subtitleQuality.selectFixes")}
          </Button>
          <Button
            type="button"
            className="rounded-xs"
            onClick={handleApply}
            disabled={selectedIssueIds.size === 0}
          >
            <IconTool />
            {t("subtitleQuality.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
