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
import { useSubtitleContext } from "@/context/subtitle-context";
import {
  buildCsvContent,
  buildPlainTextContent,
  buildSrtContent,
  buildVttContent,
} from "@/lib/format";
import { IconDownload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SaveSrt() {
  const t = useTranslations();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { tracks } = useSubtitleContext();

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

  return (
    <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={openDialog}
          disabled={isDisabled}
          className="cursor-pointer bg-zinc-800 hover:bg-neutral-700 rounded-sm"
        >
          <IconDownload size={20} />
          <span>{t("buttons.saveSrt")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>{t("dialog.saveTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.saveDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{track.name}</span>
                <span className="text-xs text-neutral-600">
                  {t("subtitle.subtitleCount", {
                    count: track.subtitles.length,
                  })}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={track.subtitles.length === 0}
                  onClick={() => downloadTrackById(track.id, "srt")}
                  className="cursor-pointer bg-zinc-800 hover:bg-neutral-700 rounded-sm"
                >
                  <IconDownload size={18} />
                  <span className="ml-1">{t("buttons.downloadAsSrt")}</span>
                </Button>
                <Button
                  disabled={track.subtitles.length === 0}
                  onClick={() => downloadTrackById(track.id, "vtt")}
                  className="cursor-pointer bg-zinc-800 hover:bg-neutral-700 rounded-sm"
                >
                  <IconDownload size={18} />
                  <span className="ml-1">{t("buttons.downloadAsVtt")}</span>
                </Button>
                <Button
                  disabled={track.subtitles.length === 0}
                  onClick={() => downloadTrackById(track.id, "txt")}
                  className="cursor-pointer bg-zinc-800 hover:bg-neutral-700 rounded-sm"
                >
                  <IconDownload size={18} />
                  <span className="ml-1">{t("buttons.downloadAsTxt")}</span>
                </Button>
                <Button
                  disabled={track.subtitles.length === 0}
                  onClick={() => downloadTrackById(track.id, "csv")}
                  className="cursor-pointer bg-zinc-800 hover:bg-neutral-700 rounded-sm"
                >
                  <IconDownload size={18} />
                  <span className="ml-1">{t("buttons.downloadAsCsv")}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
