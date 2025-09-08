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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSubtitleContext } from "@/context/subtitle-context";
import { parseSRT } from "@/lib/subtitleOperations";
import {
  IconBadgeCc,
  IconFile,
  IconPencilPlus,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function LoadSrt() {
  const t = useTranslations();
  const [isSrtDialogOpen, setIsSrtDialogOpen] = useState(false);
  const {
    tracks,
    addTrack,
    renameTrack,
    deleteTrack,
    loadSubtitlesIntoTrack,
  } = useSubtitleContext();

  const handleSrtFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    trackId: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newSubtitles = parseSRT(await file.text());
    loadSubtitlesIntoTrack(trackId, newSubtitles);
    renameTrack(trackId, file.name.replace(".srt", ""));
    setIsSrtDialogOpen(false);
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
    setIsSrtDialogOpen(false);
  };

  return (
    <Dialog open={isSrtDialogOpen} onOpenChange={setIsSrtDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="hover:bg-amber-500 hover:text-white bg-amber-300 text-black rounded-sm cursor-pointer"
        >
          <IconBadgeCc />
          <span className="leading-none truncate">{t("buttons.loadSrt")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[48rem]">
        <DialogHeader>
          <DialogTitle>{t("dialog.srtTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.srtDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {tracks.map(track => (
            <div
              key={track.id}
              className="grid grid-cols-12 items-center gap-2"
            >
              <Input
                value={track.name}
                onChange={e => renameTrack(track.id, e.target.value)}
                className="col-span-6"
              />
              <div className="col-span-5 grid grid-cols-2 gap-2">
                {track.subtitles.length > 0 ? (
                  <>
                    <Label className="w-full p-0 flex items-center justify-center">
                      {t("subtitle.subtitleCount", {
                        count: track.subtitles.length,
                      })}
                    </Label>
                    <Button asChild variant="outline" className="w-full">
                      <Label className="cursor-pointer">
                        <IconFile />
                        {t("buttons.reloadSrt")}
                        <Input
                          type="file"
                          className="hidden"
                          accept=".srt"
                          onChange={e => handleSrtFileSelect(e, track.id)}
                        />
                      </Label>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Label className="cursor-pointer">
                        <IconFile />
                        {t("buttons.loadSrtFile")}
                        <Input
                          type="file"
                          className="hidden"
                          accept=".srt"
                          onChange={e => handleSrtFileSelect(e, track.id)}
                        />
                      </Label>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer"
                      onClick={() => handleStartFromScratch(track.id)}
                    >
                      <IconPencilPlus />
                      {t("buttons.fromScratch")}
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
                      className="text-red-500 hover:bg-red-700 hover:text-white cursor-pointer"
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
                      <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
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
                t("subtitle.newTrackName", { number: tracks.length + 1 })
              )
            }
            disabled={tracks.length >= 4}
            className="mt-4 cursor-pointer"
          >
            <IconPlus />
            {t("buttons.newTrack")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}