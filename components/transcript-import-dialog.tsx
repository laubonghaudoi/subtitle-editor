"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useSubtitleActionsContext,
  useSubtitleState,
} from "@/context/subtitle-context";
import {
  segmentTranscriptToSubtitles,
  TRANSCRIPT_SEGMENTATION_DEFAULTS,
  type TranscriptSegmentationMode,
  type TranscriptSegmentationOptions,
} from "@/lib/transcript-segmentation";
import { IconFileText, IconUpload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import {
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

interface TranscriptImportDialogProps {
  children: ReactNode;
}

const TRACK_LIMIT = 4;

const parseNumberInput = (value: string, fallback: number): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getTxtTrackName = (fileName: string, fallback: string): string => {
  const trimmed = fileName.trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/\.txt$/i, "") || fallback;
};

export default function TranscriptImportDialog({
  children,
}: TranscriptImportDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [transcriptText, setTranscriptText] = useState("");
  const [trackName, setTrackName] = useState("");
  const [mode, setMode] = useState<TranscriptSegmentationMode>(
    TRANSCRIPT_SEGMENTATION_DEFAULTS.mode,
  );
  const [startTimeSeconds, setStartTimeSeconds] = useState(
    String(TRANSCRIPT_SEGMENTATION_DEFAULTS.startTimeSeconds),
  );
  const [cueDurationSeconds, setCueDurationSeconds] = useState(
    String(TRANSCRIPT_SEGMENTATION_DEFAULTS.cueDurationSeconds),
  );
  const [gapSeconds, setGapSeconds] = useState(
    String(TRANSCRIPT_SEGMENTATION_DEFAULTS.gapSeconds),
  );
  const [maxCharactersPerCue, setMaxCharactersPerCue] = useState(
    String(TRANSCRIPT_SEGMENTATION_DEFAULTS.maxCharactersPerCue),
  );
  const fileInputId = useId();
  const { loadSubtitlesIntoTrack, renameTrack, setInitialSubtitles } =
    useSubtitleActionsContext();
  const { tracks, activeTrackId } = useSubtitleState();

  const defaultTrackName = t("transcriptImport.defaultTrackName");
  const effectiveTrackName = trackName.trim() || defaultTrackName;
  const activeTrack = activeTrackId
    ? tracks.find((track) => track.id === activeTrackId)
    : null;
  const activeTrackIsEmpty = Boolean(
    activeTrack && activeTrack.subtitles.length === 0,
  );
  const cannotCreateTrack = tracks.length >= TRACK_LIMIT && !activeTrackIsEmpty;
  const destinationText =
    activeTrack && activeTrackIsEmpty
      ? t("transcriptImport.destinationReplace", { track: activeTrack.name })
      : t("transcriptImport.destinationNewTrack");

  const segmentationOptions = useMemo<TranscriptSegmentationOptions>(
    () => ({
      mode,
      startTimeSeconds: parseNumberInput(
        startTimeSeconds,
        TRANSCRIPT_SEGMENTATION_DEFAULTS.startTimeSeconds,
      ),
      cueDurationSeconds: parseNumberInput(
        cueDurationSeconds,
        TRANSCRIPT_SEGMENTATION_DEFAULTS.cueDurationSeconds,
      ),
      gapSeconds: parseNumberInput(
        gapSeconds,
        TRANSCRIPT_SEGMENTATION_DEFAULTS.gapSeconds,
      ),
      maxCharactersPerCue: parseNumberInput(
        maxCharactersPerCue,
        TRANSCRIPT_SEGMENTATION_DEFAULTS.maxCharactersPerCue,
      ),
    }),
    [
      mode,
      startTimeSeconds,
      cueDurationSeconds,
      gapSeconds,
      maxCharactersPerCue,
    ],
  );

  const previewSubtitles = useMemo(
    () => segmentTranscriptToSubtitles(transcriptText, segmentationOptions),
    [transcriptText, segmentationOptions],
  );

  const importDisabled = cannotCreateTrack || previewSubtitles.length === 0;

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setTranscriptText(text);
    setTrackName(getTxtTrackName(file.name, defaultTrackName));
    event.currentTarget.value = "";
  };

  const handleImport = () => {
    if (importDisabled) return;

    if (activeTrackId && activeTrackIsEmpty) {
      loadSubtitlesIntoTrack(activeTrackId, previewSubtitles);
      renameTrack(activeTrackId, effectiveTrackName);
    } else {
      setInitialSubtitles(previewSubtitles, effectiveTrackName);
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("transcriptImport.title")}</DialogTitle>
          <DialogDescription>
            {t("transcriptImport.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={fileInputId}>
              {t("transcriptImport.fileLabel")}
            </Label>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Label htmlFor={fileInputId} className="cursor-pointer">
                  <IconUpload />
                  {t("transcriptImport.chooseFile")}
                </Label>
              </Button>
              <Input
                id={fileInputId}
                type="file"
                className="hidden"
                accept=".txt,text/plain"
                onChange={handleFileSelect}
              />
              <span className="text-sm text-muted-foreground">
                {t("transcriptImport.fileHint")}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transcript-import-text">
              {t("transcriptImport.pasteLabel")}
            </Label>
            <Textarea
              id="transcript-import-text"
              value={transcriptText}
              onChange={(event) => setTranscriptText(event.target.value)}
              placeholder={t("transcriptImport.pastePlaceholder")}
              className="min-h-36 resize-y text-sm md:text-sm"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <div className="grid gap-1 md:col-span-2">
              <Label htmlFor="transcript-import-track-name">
                {t("transcriptImport.trackNameLabel")}
              </Label>
              <Input
                id="transcript-import-track-name"
                value={trackName}
                onChange={(event) => setTrackName(event.target.value)}
                placeholder={defaultTrackName}
                className="px-2 py-2"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="transcript-import-mode">
                {t("transcriptImport.modeLabel")}
              </Label>
              <select
                id="transcript-import-mode"
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as TranscriptSegmentationMode)
                }
                className="h-10 rounded-md border border-input bg-background px-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="lines">{t("transcriptImport.modeLines")}</option>
                <option value="sentences">
                  {t("transcriptImport.modeSentences")}
                </option>
                <option value="maxCharacters">
                  {t("transcriptImport.modeMaxCharacters")}
                </option>
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="transcript-import-duration">
                {t("transcriptImport.durationLabel")}
              </Label>
              <Input
                id="transcript-import-duration"
                type="number"
                min="0.1"
                step="0.1"
                value={cueDurationSeconds}
                onChange={(event) => setCueDurationSeconds(event.target.value)}
                className="px-2 py-2"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="transcript-import-gap">
                {t("transcriptImport.gapLabel")}
              </Label>
              <Input
                id="transcript-import-gap"
                type="number"
                min="0"
                step="0.1"
                value={gapSeconds}
                onChange={(event) => setGapSeconds(event.target.value)}
                className="px-2 py-2"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <div className="grid gap-1">
              <Label htmlFor="transcript-import-start">
                {t("transcriptImport.startOffsetLabel")}
              </Label>
              <Input
                id="transcript-import-start"
                type="number"
                min="0"
                step="0.1"
                value={startTimeSeconds}
                onChange={(event) => setStartTimeSeconds(event.target.value)}
                className="px-2 py-2"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="transcript-import-max-chars">
                {t("transcriptImport.maxCharactersLabel")}
              </Label>
              <Input
                id="transcript-import-max-chars"
                type="number"
                min="1"
                step="1"
                disabled={mode !== "maxCharacters"}
                value={maxCharactersPerCue}
                onChange={(event) => setMaxCharactersPerCue(event.target.value)}
                className="px-2 py-2"
              />
            </div>
            <div className="flex items-end md:col-span-3">
              <p className="text-sm text-muted-foreground">
                {cannotCreateTrack
                  ? t("transcriptImport.trackLimitReached")
                  : destinationText}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {t("transcriptImport.previewTitle")}
              </h3>
              <span className="text-sm text-muted-foreground">
                {t("transcriptImport.cueCount", {
                  count: previewSubtitles.length,
                })}
              </span>
            </div>
            <div className="max-h-60 overflow-auto rounded-sm border">
              {previewSubtitles.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="w-16 px-2 py-2 font-medium">
                        {t("transcriptImport.table.id")}
                      </th>
                      <th className="w-32 px-2 py-2 font-medium">
                        {t("transcriptImport.table.start")}
                      </th>
                      <th className="w-32 px-2 py-2 font-medium">
                        {t("transcriptImport.table.end")}
                      </th>
                      <th className="px-2 py-2 font-medium">
                        {t("transcriptImport.table.text")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSubtitles.map((subtitle) => (
                      <tr
                        key={subtitle.uuid}
                        className="border-b last:border-0"
                      >
                        <td className="px-2 py-2 align-top">{subtitle.id}</td>
                        <td className="px-2 py-2 align-top">
                          {subtitle.startTime}
                        </td>
                        <td className="px-2 py-2 align-top">
                          {subtitle.endTime}
                        </td>
                        <td className="px-2 py-2 align-top">{subtitle.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  {t("transcriptImport.emptyPreview")}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("dialog.cancel")}</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={importDisabled}>
            <IconFileText />
            {t("transcriptImport.importButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
