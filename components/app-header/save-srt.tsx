"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubtitleState } from "@/context/subtitle-context";
import {
  downloadSubtitleFile,
  saveSubtitleFile,
  type SubtitleFormat,
} from "@/lib/save-subtitle-file";
import { getTrackHandleColor } from "@/lib/track-colors";
import type { SubtitleTrack } from "@/types/subtitle";
import { IconDownload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

export default function SaveSrt() {
  const t = useTranslations();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [download, setDownload] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const filenameId = useId();
  const { tracks } = useSubtitleState();

  const changeDialogOpen = (open: boolean) => {
    if (isSaving) return;
    setDownload(null);
    setSaveFailed(false);
    setIsSaveDialogOpen(open);
  };

  const saveTrack = async (track: SubtitleTrack, format: SubtitleFormat) => {
    setSaveFailed(false);
    setIsSaving(true);
    try {
      const result = await saveSubtitleFile(track, format);
      if (result === "saved") {
        setIsSaveDialogOpen(false);
      } else if (result !== "cancelled") {
        setFilename(result.name);
        setDownload(result);
      }
    } catch {
      setSaveFailed(true);
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled =
    tracks.length === 0 || !tracks.some((track) => track.subtitles.length > 0);

  // .srt leads (solid teal, like the Save button); the rest are teal-tint
  // alternates. Teal is our single "export / get data out" color.
  const formats = [
    {
      format: "srt" as const,
      label: t("buttons.downloadAsSrt"),
      primary: true,
    },
    {
      format: "vtt" as const,
      label: t("buttons.downloadAsVtt"),
      primary: false,
    },
    {
      format: "txt" as const,
      label: t("buttons.downloadAsTxt"),
      primary: false,
    },
    {
      format: "csv" as const,
      label: t("buttons.downloadAsCsv"),
      primary: false,
    },
  ];

  return (
    <Dialog open={isSaveDialogOpen} onOpenChange={changeDialogOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isDisabled}
          className="cursor-pointer text-black bg-teal-800 hover:bg-teal-900 rounded-xs border-2 border-black dark:border-white"
          aria-label={t("buttons.saveSrt")}
        >
          <IconDownload size={20} />
          <span className="hidden sm:inline">{t("buttons.saveSrt")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-160">
        <DialogHeader>
          <DialogTitle>
            {download ? t("dialog.saveFilenameTitle") : t("dialog.saveTitle")}
          </DialogTitle>
          <DialogDescription>
            {download
              ? t("dialog.saveDownloadHint")
              : t("dialog.saveDescription")}
          </DialogDescription>
        </DialogHeader>
        {saveFailed && <p role="alert">{t("dialog.saveError")}</p>}
        {download ? (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                downloadSubtitleFile(download, filename.trim());
                changeDialogOpen(false);
              } catch {
                setSaveFailed(true);
              }
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor={filenameId}>{t("dialog.saveFilename")}</Label>
              <Input
                id={filenameId}
                autoFocus
                required
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => changeDialogOpen(true)}
              >
                {t("dialog.cancel")}
              </Button>
              <Button type="submit" disabled={!filename.trim()}>
                {t("buttons.download")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid gap-3 py-2">
            {tracks.map((track, index) => {
              const barColor = getTrackHandleColor(index);
              const isEmpty = track.subtitles.length === 0;
              return (
                <div
                  key={track.id}
                  className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center pl-4"
                  style={{ boxShadow: `inset 4px 0 0 ${barColor}` }}
                >
                  <div className="min-w-0">
                    <span
                      className="block truncate font-medium"
                      title={track.name}
                    >
                      {track.name}
                    </span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">
                      {t("subtitle.subtitleCount", {
                        count: track.subtitles.length,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {formats.map(({ format, label, primary }) => (
                      <Button
                        key={format}
                        disabled={isEmpty || isSaving}
                        onClick={() => saveTrack(track, format)}
                        className={
                          primary
                            ? "cursor-pointer text-black bg-teal-800 hover:bg-teal-900 rounded-xs border-2 border-black dark:border-white"
                            : "cursor-pointer text-[color:var(--teal-12)] bg-teal-200 hover:bg-teal-300 rounded-xs border-2 border-black dark:border-white"
                        }
                      >
                        <IconDownload size={18} />
                        <span className="ml-1">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
