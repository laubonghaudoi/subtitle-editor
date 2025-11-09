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
import { useSubtitleContext } from "@/context/subtitle-context";
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
import {
  getReadableTextColor,
  getTrackHandleColor,
  hexToRgba,
} from "@/lib/track-colors";

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
  const { subtitles, replaceAllSubtitlesAction, tracks, activeTrack } =
    useSubtitleContext();
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
  const headerColor = hexToRgba(trackHandleColor, 0.9);
  const headerTextColor = getReadableTextColor(trackHandleColor);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xs cursor-pointer border-black dark:border-white"
          disabled={isDisabled}
        >
          <IconSearch />
          <span>{t("findReplace.title")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("findReplace.dialogTitle", { track: trackName })}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="find">{t("findReplace.find")}</Label>
            <Input
              id="find"
              value={findText}
              onChange={(event) => setFindText(event.target.value)}
              className="flex-1 rounded-xs px-2 py-1"
            />
          </div>
          <div className="flex gap-4">
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
          <div className="flex items-center gap-2">
            <Label htmlFor="replace">{t("findReplace.replaceWith")}</Label>
            <Input
              id="replace"
              value={replaceText}
              onChange={(event) => setReplaceText(event.target.value)}
              className="flex-1 rounded-xs px-2 py-1 text-base"
            />
          </div>
          <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
            <span>
              {selectedCount} / {matchedSubtitles.length}{" "}
              {t("findReplace.selected")}
            </span>
            <Button
              className="rounded-sm bg-slate-800 hover:bg-slate-600 dark:bg-slate-100 dark:hover:bg-slate-200"
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
