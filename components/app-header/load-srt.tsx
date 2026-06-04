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
import { Switch } from "@/components/ui/switch";
import {
  useSubtitleActionsContext,
  useSubtitleState,
} from "@/context/subtitle-context";
import { useToast } from "@/hooks/use-toast";
import {
  extractVttPrologue,
  parseSRT,
  parseVTT,
} from "@/lib/subtitle-operations";
import { getTrackHandleColor } from "@/lib/track-colors";
import {
  IconBadgeCc,
  IconFile,
  IconPencilPlus,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState, type CSSProperties } from "react";
import { v4 as uuidv4 } from "uuid";

const getTrackButtonStyle = (trackIndex: number): CSSProperties => {
  const backgroundColor = getTrackHandleColor(trackIndex);
  return {
    backgroundColor,
    color: "#000000",
  };
};

export default function LoadSrt() {
  const t = useTranslations();
  const [isSrtDialogOpen, setIsSrtDialogOpen] = useState(false);
  const { toast } = useToast();
  const showTrackLabelsId = useId();
  const { addTrack, renameTrack, deleteTrack, loadSubtitlesIntoTrack } =
    useSubtitleActionsContext();
  const { tracks, showTrackLabels, setShowTrackLabels } = useSubtitleState();

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
          variant: "destructive",
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast({
        title: "Failed to load subtitles",
        description: errorMessage || "Unknown error",
        variant: "destructive",
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
          className="text-white bg-iris-800 hover:bg-iris-900 dark:hover:bg-iris-700 rounded-xs border-2 border-black dark:border-white cursor-pointer"
          aria-label={t("buttons.loadSrt")}
        >
          <IconBadgeCc />
          <span className="hidden leading-none truncate sm:inline">
            {t("buttons.loadSrt")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl" hideClose>
        <DialogHeader>
          <DialogTitle>{t("dialog.srtTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.srtDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {tracks.map((track, trackIndex) => {
            const fileButtonStyle = getTrackButtonStyle(trackIndex);
            return (
              <div
                key={track.id}
                className="grid grid-cols-12 items-center gap-2"
              >
                <Input
                  value={track.name}
                  onChange={(e) => renameTrack(track.id, e.target.value)}
                  className="px-2 py-2 col-span-4 border-foreground rounded-xs"
                />
                <div className="col-span-7 grid grid-cols-[minmax(8rem,1fr)_minmax(0,1.2fr)] gap-2">
                  {track.subtitles.length > 0 ? (
                    <>
                      <Label className="w-full min-w-0 p-0 flex items-center justify-center">
                        {t("subtitle.subtitleCount", {
                          count: track.subtitles.length,
                        })}
                      </Label>
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full min-w-0 border-2 border-black hover:opacity-90 dark:border-white"
                        style={fileButtonStyle}
                      >
                        <Label className="min-w-0 cursor-pointer">
                          <IconFile />
                          <span className="min-w-0 truncate">
                            {t("buttons.reloadSrt")}
                          </span>
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
                        variant="outline"
                        className="w-full min-w-0 cursor-pointer border-black hover:bg-[var(--iris-4)] dark:border-white"
                        onClick={() => handleStartFromScratch(track.id)}
                      >
                        <IconPencilPlus />
                        <span className="min-w-0 truncate">
                          {t("buttons.fromScratch")}
                        </span>
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full min-w-0 border-2 border-black hover:opacity-90 dark:border-white"
                        style={fileButtonStyle}
                      >
                        <Label className="min-w-0 cursor-pointer">
                          <IconFile />
                          <span className="min-w-0 truncate">
                            {t("buttons.loadSrtFile")}
                          </span>
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
                        className="rounded-xs ring-1 ring-inset ring-red-800 bg-red-200 hover:bg-red-300 text-[color:var(--red-11)] hover:text-[color:var(--red-11)] cursor-pointer"
                        aria-label={t("dialog.deleteTrackTitle")}
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
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                        >
                          {t("dialog.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            onClick={() =>
              addTrack(
                t("subtitle.newTrackName", { number: tracks.length + 1 }),
              )
            }
            disabled={tracks.length >= 4}
            className="mt-4 cursor-pointer border-black dark:border-white border-dashed hover:border-2 hover:bg-transparent disabled:border-none"
          >
            {tracks.length < 4 && <IconPlus />}
            {tracks.length >= 4
              ? t("buttons.maxTracksReached")
              : t("buttons.newTrack")}
          </Button>
        </div>
        <DialogFooter className="">
          <div className="flex justify-between items-center gap-2 mr-auto">
            <Switch
              id={showTrackLabelsId}
              checked={showTrackLabels}
              onCheckedChange={setShowTrackLabels}
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
