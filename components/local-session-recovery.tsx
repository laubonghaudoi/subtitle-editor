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
      <DialogContent className="sm:max-w-lg" hideClose>
        <DialogHeader>
          <DialogTitle>{t("localSession.title")}</DialogTitle>
          <DialogDescription>{t("localSession.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border-2 border-foreground bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          <p className="font-medium">
            {t("localSession.summary", {
              tracks: sessionSummary.trackCount,
              subtitles: sessionSummary.subtitleCount,
            })}
          </p>
          <p className="text-muted-foreground">
            {t("localSession.savedAt", { time: sessionSummary.savedAt })}
          </p>
          <p className="text-muted-foreground">{t("localSession.privacy")}</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadLocalSessionBackup(pendingLocalSession)}
          >
            <IconDownload />
            {t("localSession.downloadBackup")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={discardLocalSession}
          >
            <IconTrash />
            {t("localSession.discard")}
          </Button>
          <Button type="button" onClick={restoreLocalSession}>
            <IconRestore />
            {t("localSession.restore")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
