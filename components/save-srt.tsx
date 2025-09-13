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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildSrtContent, buildVttContent } from "@/lib/format";

export default function SaveSrt() {
  const t = useTranslations();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [format, setFormat] = useState<"srt" | "vtt">("srt");
  const { tracks } = useSubtitleContext();

  const downloadTrackById = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || track.subtitles.length === 0) return;
    const content =
      format === "vtt"
        ? buildVttContent(track.subtitles)
        : buildSrtContent(track.subtitles);
    const mime = format === "vtt" ? "text/vtt" : "text/plain";
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

  const handleSaveClick = () => {
    // Always open dialog to choose format and track
    setIsSaveDialogOpen(true);
  };

  const tracksWithSubtitles = tracks.filter(
    (track) => track.subtitles.length > 0
  );
  const shouldShowDialog = true;

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
        <div className="mb-3">
          <Tabs value={format} onValueChange={(v) => setFormat(v as any)}>
            <TabsList>
              <TabsTrigger value="srt">SRT</TabsTrigger>
              <TabsTrigger value="vtt">VTT</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
