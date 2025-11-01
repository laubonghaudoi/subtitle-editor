"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useSubtitleContext } from "@/context/subtitle-context";
import {
  parseSRT,
  parseVTT,
  extractVttPrologue,
} from "@/lib/subtitle-operations";
import {
  IconBadgeCc,
  IconFile,
  IconPencilPlus,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

export default function LoadSrt() {
  const t = useTranslations();
  const [isSrtDialogOpen, setIsSrtDialogOpen] = useState(false);
  const { toast } = useToast();
  const showTrackLabelsId = useId();
  const {
    tracks,
    addTrack,
    renameTrack,
    deleteTrack,
    loadSubtitlesIntoTrack,
    showTrackLabels,
    setShowTrackLabels,
  } = useSubtitleContext();

  const handleSrtFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    trackId: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await file.text();
      const lower = file.name.toLowerCase();
      const firstLine =
        raw.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
      const isVtt = lower.endsWith(".vtt") || /^WEBVTT( |$)/.test(firstLine);
      const newSubtitles = isVtt ? parseVTT(raw) : parseSRT(raw);
      const meta = isVtt ? extractVttPrologue(raw) : undefined;
      if (newSubtitles.length === 0) {
        toast({
          title: "Invalid subtitle file",
          description: "No valid cues were found.",
          variant: "destructive" as any,
        });
        return;
      }
      loadSubtitlesIntoTrack(
        trackId,
        newSubtitles,
        meta
          ? { vttHeader: meta.header, vttPrologue: meta.prologue }
          : undefined,
      );
      const safeName = file.name.replace(/\.(srt|vtt)$/i, "");
      renameTrack(trackId, safeName);
    } catch (err: any) {
      toast({
        title: "Failed to load subtitles",
        description: String(err?.message || err) || "Unknown error",
        variant: "destructive" as any,
      });
    }
  };

  const handleStartFromScratch = (trackId: string) => {
    loadSubtitlesIntoTrack(trackId, [
      {
        uuid: uuidv4(),
        id: 1,
        startTime: "00:00:00,000",
        endTime: "00:00:03,000",
        text: t("subtitle.newSubtitle"),
      },
    ]);
  };

  // Auto-create first track when dialog opens and there are none
  useEffect(() => {
    if (isSrtDialogOpen && tracks.length === 0) {
      addTrack(t("subtitle.newTrackName", { number: 1 }));
    }
    // Depend on length only to avoid re-adding due to other track updates
  }, [isSrtDialogOpen, tracks.length, addTrack, t]);

  return (
    <Dialog open={isSrtDialogOpen} onOpenChange={setIsSrtDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="hover:bg-amber-500 hover:text-white bg-yellow-300 text-black rounded-sm cursor-pointer"
        >
          <IconBadgeCc />
          <span className="leading-none truncate">{t("buttons.loadSrt")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl" hideClose>
        <DialogHeader>
          <DialogTitle>{t("dialog.srtTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.srtDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="grid grid-cols-12 items-center gap-2"
            >
              <Input
                value={track.name}
                onChange={(e) => renameTrack(track.id, e.target.value)}
                className="px-2 py-2 col-span-5 border-neutral-500 rounded-sm"
              />
              <div className="col-span-6 grid grid-cols-2 gap-2">
                {track.subtitles.length > 0 ? (
                  <>
                    <Label className="w-full p-0 flex items-center justify-center">
                      {t("subtitle.subtitleCount", {
                        count: track.subtitles.length,
                      })}
                    </Label>
                    <Button asChild variant="secondary" className="w-full">
                      <Label className="cursor-pointer">
                        <IconFile />
                        {t("buttons.reloadSrt")}
                        <Input
                          type="file"
                          className="hidden"
                          accept=".srt,.vtt"
                          onChange={(e) => handleSrtFileSelect(e, track.id)}
                        />
                      </Label>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      className="w-full cursor-pointer"
                      onClick={() => handleStartFromScratch(track.id)}
                    >
                      <IconPencilPlus />
                      {t("buttons.fromScratch")}
                    </Button>
                    <Button asChild variant="secondary" className="w-full">
                      <Label className="cursor-pointer">
                        <IconFile />
                        {t("buttons.loadSrtFile")}
                        <Input
                          type="file"
                          className="hidden"
                          accept=".srt,.vtt"
                          onChange={(e) => handleSrtFileSelect(e, track.id)}
                        />
                      </Label>
                    </Button>
                  </>
                )}
              </div>
              <div className="col-span-1 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-700 hover:text-white bg-red-100 cursor-pointer"
                    >
                      <IconTrash />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("dialog.deleteTrackTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("dialog.deleteTrackDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("dialog.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTrack(track.id)}
                        className="bg-red-700 hover:bg-red-500 cursor-pointer"
                      >
                        {t("dialog.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() =>
              addTrack(
                t("subtitle.newTrackName", { number: tracks.length + 1 }),
              )
            }
            disabled={tracks.length >= 4}
            className="mt-4 cursor-pointer border-black border-dashed hover:border-2 hover:bg-transparent disabled:border-none"
          >
            {tracks.length < 4 && <IconPlus />}
            {tracks.length >= 4
              ? t("buttons.maxTracksReached")
              : t("buttons.newTrack")}
          </Button>
        </div>
        <DialogFooter className="">
          <div className="flex justify-between items-center gap-2 mr-auto">
            <Checkbox
              id={showTrackLabelsId}
              checked={showTrackLabels}
              onCheckedChange={(v) => setShowTrackLabels(Boolean(v))}
            />
            <Label htmlFor={showTrackLabelsId} className="cursor-pointer">
              {t("dialog.showTrackLabels")}
            </Label>
          </div>
          <DialogClose asChild>
            <Button className="cursor-pointer">{t("dialog.done")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
