"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalSession } from "@/context/subtitle-context";
import { IconDownload, IconRestore, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

export default function LocalSessionRecovery() {
  const t = useTranslations();
  const {
    pendingLocalSession,
    restoreLocalSession,
    discardLocalSession,
    downloadLocalSessionBackup,
  } = useLocalSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sessionSummary = useMemo(() => {
    if (!pendingLocalSession) {
      return null;
    }
    const trackCount = pendingLocalSession.tracks.length;
    const subtitleCount = pendingLocalSession.tracks.reduce(
      (total, track) => total + track.subtitles.length,
      0,
    );
    const savedAt = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(pendingLocalSession.savedAt));

    return { trackCount, subtitleCount, savedAt };
  }, [pendingLocalSession]);

  if (!isMounted || !pendingLocalSession || !sessionSummary) {
    return null;
  }

  return (
    <Dialog open>
      <DialogContent
        className="max-w-[calc(100vw-2rem)] text-base sm:max-w-xl"
        hideClose
      >
        <DialogHeader className="min-w-0">
          <DialogTitle className="text-xl leading-tight">
            {t("localSession.title")}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {t("localSession.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3 overflow-hidden rounded-lg border-2 border-foreground bg-neutral-50 p-4 text-base leading-relaxed dark:bg-neutral-900">
          <p className="break-words font-medium">
            {t("localSession.summary", {
              tracks: sessionSummary.trackCount,
              subtitles: sessionSummary.subtitleCount,
            })}
          </p>
          <p className="break-words text-muted-foreground">
            {t("localSession.savedAt", { time: sessionSummary.savedAt })}
          </p>
          <p className="break-words text-muted-foreground">
            {t("localSession.privacy")}
          </p>
        </div>

        <DialogFooter className="sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto text-base"
            onClick={() => downloadLocalSessionBackup(pendingLocalSession)}
          >
            <IconDownload />
            {t("localSession.downloadBackup")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full sm:w-auto text-base"
            onClick={discardLocalSession}
          >
            <IconTrash />
            {t("localSession.discard")}
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto text-base"
            onClick={restoreLocalSession}
          >
            <IconRestore />
            {t("localSession.restore")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
