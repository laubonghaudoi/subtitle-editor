"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSubtitleState } from "@/context/subtitle-context";
import {
  buildCsvContent,
  buildPlainTextContent,
  buildSrtContent,
  buildVttContent,
} from "@/lib/format";
import { getTrackHandleColor } from "@/lib/track-colors";
import { IconDownload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SaveSrt() {
  const t = useTranslations();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { tracks } = useSubtitleState();

  const downloadTrackById = (
    trackId: string,
    format: "srt" | "vtt" | "txt" | "csv",
  ) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || track.subtitles.length === 0) return;
    let content: string;
    if (format === "vtt") {
      content = buildVttContent(track.subtitles, {
        header: track.vttHeader,
        prologue: track.vttPrologue,
      });
    } else if (format === "csv") {
      content = buildCsvContent(track.subtitles);
    } else if (format === "txt") {
      content = buildPlainTextContent(track.subtitles);
    } else {
      content = buildSrtContent(track.subtitles);
    }
    const mime =
      format === "vtt"
        ? "text/vtt"
        : format === "csv"
          ? "text/csv"
          : "text/plain";
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (track.name || "subtitles").replace(/\s+/g, "_");
    a.download = `${safeName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSaveDialogOpen(false);
  };

  const openDialog = () => setIsSaveDialogOpen(true);
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
    <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={openDialog}
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
          <DialogTitle>{t("dialog.saveTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.saveDescription")}</DialogDescription>
        </DialogHeader>
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
                      disabled={isEmpty}
                      onClick={() => downloadTrackById(track.id, format)}
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
      </DialogContent>
    </Dialog>
  );
}
