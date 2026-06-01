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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FindReplaceTable } from "@/components/find-replace/table";
import {
  useSubtitleActionsContext,
  useSubtitleState,
  useSubtitles,
} from "@/context/subtitle-context";
import { useFindReplaceSelection } from "@/hooks/use-find-replace-selection";
import { getFindRegexConfig } from "@/lib/find-replace";
import {
  analyzeRegexSource,
  applyRegexReplacement,
  collectMatches,
} from "@/lib/find-replace-helpers";
import type { Subtitle } from "@/types/subtitle";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { IconReplace, IconSearch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { getTrackHandleColor } from "@/lib/track-colors";

const coerceCheckedState = (checked: CheckedState) =>
  checked === "indeterminate" ? true : Boolean(checked);

type OptionToggleProps = {
  id: string;
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
};

function OptionToggle({ id, checked, label, onChange }: OptionToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(state) => onChange(coerceCheckedState(state))}
      />
      <Label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </Label>
    </div>
  );
}

export default function FindReplace() {
  const t = useTranslations();
  const subtitles = useSubtitles();
  const { replaceAllSubtitlesAction } = useSubtitleActionsContext();
  const { tracks, activeTrack } = useSubtitleState();
  const totalSubtitleCount = tracks.reduce(
    (sum, tr) => sum + tr.subtitles.length,
    0,
  );
  const isDisabled = totalSubtitleCount === 0;

  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isMatchFullWord, setIsMatchFullWord] = useState(false);
  const [isRegexMode, setIsRegexMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [matchedSubtitles, setMatchedSubtitles] = useState<Subtitle[]>([]);

  const {
    selectedIds,
    selectIds,
    toggleId,
    clear: clearSelection,
    prune: pruneSelection,
  } = useFindReplaceSelection();

  const regexConfig = useMemo(
    () =>
      getFindRegexConfig(findText, {
        isCaseSensitive,
        isMatchFullWord,
        isRegexMode,
      }),
    [findText, isCaseSensitive, isMatchFullWord, isRegexMode],
  );

  const compiledRegex = useMemo(() => {
    if (!regexConfig) {
      return null;
    }
    try {
      return new RegExp(regexConfig.source, regexConfig.flags);
    } catch {
      return null;
    }
  }, [regexConfig]);

  const regexFeatures = useMemo(
    () => (compiledRegex ? analyzeRegexSource(compiledRegex) : null),
    [compiledRegex],
  );
  const allowZeroLengthMatches = regexFeatures?.allowZeroLength ?? false;

  useEffect(() => {
    if (!findText) {
      setMatchedSubtitles([]);
      clearSelection();
      return;
    }

    if (!compiledRegex) {
      setMatchedSubtitles([]);
      clearSelection();
      return;
    }

    const nextMatches = subtitles.filter((subtitle) => {
      const matches = collectMatches(
        subtitle.text,
        compiledRegex,
        allowZeroLengthMatches,
      );
      return matches.length > 0;
    });

    setMatchedSubtitles(nextMatches);
    pruneSelection(nextMatches.map((subtitle) => subtitle.id));
  }, [
    subtitles,
    findText,
    compiledRegex,
    allowZeroLengthMatches,
    clearSelection,
    pruneSelection,
  ]);

  const handleReplace = () => {
    if (!compiledRegex || selectedIds.size === 0) {
      return;
    }

    let changesMade = false;

    const updatedSubtitles = subtitles.map((subtitle) => {
      if (!selectedIds.has(subtitle.id)) {
        return subtitle;
      }

      const { result, changed } = applyRegexReplacement(
        subtitle.text,
        compiledRegex,
        replaceText,
        allowZeroLengthMatches,
      );

      if (!changed) {
        return subtitle;
      }

      changesMade = true;
      return { ...subtitle, text: result };
    });

    if (!changesMade) {
      return;
    }

    replaceAllSubtitlesAction(updatedSubtitles);
    clearSelection();
  };

  const selectedCount = selectedIds.size;
  const trackName =
    activeTrack?.name ??
    tracks[0]?.name ??
    t("subtitle.newTrackName", { number: 1 });
  const activeTrackIndex = activeTrack
    ? tracks.findIndex((track) => track.id === activeTrack.id)
    : tracks.length > 0
      ? 0
      : -1;
  const resolvedTrackIndex = activeTrackIndex >= 0 ? activeTrackIndex : 0;
  const trackHandleColor = getTrackHandleColor(resolvedTrackIndex);
  const headerColor = trackHandleColor;
  const headerTextColor = "#000000";

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="cursor-pointer rounded-[2px] border-black dark:border-white"
          disabled={isDisabled}
          aria-label={t("findReplace.title")}
        >
          <IconSearch />
          <span className="hidden sm:inline">{t("findReplace.title")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-[4px] sm:max-w-3xl sm:rounded-[4px]">
        <DialogHeader className="min-w-0">
          <DialogTitle className="min-w-0 leading-tight break-words">
            {t("findReplace.dialogTitle", { track: trackName })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Label htmlFor="find" className="shrink-0">
              {t("findReplace.find")}
            </Label>
            <Input
              id="find"
              value={findText}
              onChange={(event) => setFindText(event.target.value)}
              className="min-w-0 flex-1 rounded-[2px] px-2 py-1"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <OptionToggle
              id="case-sensitive"
              checked={isCaseSensitive}
              label={t("findReplace.caseSensitive")}
              onChange={setIsCaseSensitive}
            />
            <OptionToggle
              id="match-full-word"
              checked={isMatchFullWord}
              label={t("findReplace.matchFullWord")}
              onChange={setIsMatchFullWord}
            />
            <OptionToggle
              id="regex-mode"
              checked={isRegexMode}
              label={t("findReplace.useRegex")}
              onChange={setIsRegexMode}
            />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Label htmlFor="replace" className="shrink-0">
              {t("findReplace.replaceWith")}
            </Label>
            <Input
              id="replace"
              value={replaceText}
              onChange={(event) => setReplaceText(event.target.value)}
              className="min-w-0 flex-1 rounded-[2px] px-2 py-1 text-base"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
            <span>
              {selectedCount} / {matchedSubtitles.length}{" "}
              {t("findReplace.selected")}
            </span>
            <Button
              className="rounded-[2px] border-2 border-black bg-iris-800 text-white hover:bg-iris-900 dark:border-white"
              onClick={handleReplace}
              disabled={selectedCount === 0}
            >
              <IconReplace />
              {t("findReplace.replace")}
            </Button>
          </div>
          <FindReplaceTable
            matchedSubtitles={matchedSubtitles}
            compiledRegex={compiledRegex}
            findText={findText}
            replaceText={replaceText}
            allowZeroLengthMatches={allowZeroLengthMatches}
            selectedIds={selectedIds}
            labels={{
              id: t("findReplace.id"),
              original: t("findReplace.original"),
              preview: t("findReplace.preview"),
              noMatches: t("findReplace.noMatches"),
            }}
            onToggleRow={toggleId}
            onToggleAll={(shouldSelectAll) => {
              if (shouldSelectAll) {
                selectIds(matchedSubtitles.map((subtitle) => subtitle.id));
              } else {
                clearSelection();
              }
            }}
            headerColor={headerColor}
            headerTextColor={headerTextColor}
          />
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
