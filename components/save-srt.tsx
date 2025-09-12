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
import { IconDownload } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SaveSrt() {
  const t = useTranslations();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const { tracks } = useSubtitleContext();

  const buildSrtContent = (subtitles: (typeof tracks)[0]["subtitles"]) => {
    return subtitles
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((subtitle) => {
        return `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}\n`;
      })
      .join("\n");
  };

  const downloadTrackById = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || track.subtitles.length === 0) return;

    const srtContent = buildSrtContent(track.subtitles);
    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (track.name || "subtitles").replace(/\s+/g, "_");
    a.download = `${safeName}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsSaveDialogOpen(false);
  };

  const handleSaveClick = () => {
    // If there's only one track with subtitles, download it directly
    const tracksWithSubtitles = tracks.filter(
      (track) => track.subtitles.length > 0
    );
    if (tracksWithSubtitles.length === 1) {
      downloadTrackById(tracksWithSubtitles[0].id);
    } else {
      // Multiple tracks or no tracks, show dialog
      setIsSaveDialogOpen(true);
    }
  };

  const tracksWithSubtitles = tracks.filter(
    (track) => track.subtitles.length > 0
  );
  const shouldShowDialog = tracksWithSubtitles.length > 1;

  return (
    <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
      {shouldShowDialog ? (
        <DialogTrigger asChild>
          <Button
            onClick={handleSaveClick}
            disabled={
              tracks.length === 0 ||
              !tracks.some((tr) => tr.subtitles.length > 0)
            }
            className="cursor-pointer"
          >
            <IconDownload size={20} />
            <span>{t("buttons.saveSrt")}</span>
          </Button>
        </DialogTrigger>
      ) : (
        <Button
          onClick={handleSaveClick}
          disabled={
            tracks.length === 0 || !tracks.some((tr) => tr.subtitles.length > 0)
          }
          className="cursor-pointer"
        >
          <IconDownload size={20} />
          <span>{t("buttons.saveSrt")}</span>
        </Button>
      )}
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
              <Button
                variant="default"
                disabled={track.subtitles.length === 0}
                onClick={() => downloadTrackById(track.id)}
                className="cursor-pointer"
              >
                <IconDownload size={18} />
                <span className="ml-1">{t("buttons.download")}</span>
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
