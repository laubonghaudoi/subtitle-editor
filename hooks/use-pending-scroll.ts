"use client";

import type { SubtitleListRef } from "@/components/subtitle/subtitle-list";
import { warnDev } from "@/lib/log";
import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";

interface PendingScrollRequest {
  uuid: string;
  instant: boolean;
}

export const usePendingScroll = (
  subtitleListRef: RefObject<SubtitleListRef | null>,
) => {
  const [pendingScroll, setPendingScroll] =
    useState<PendingScrollRequest | null>(null);

  const requestScroll = useCallback(
    (uuid: string, opts?: { instant?: boolean }) => {
      setPendingScroll({ uuid, instant: Boolean(opts?.instant) });
    },
    [],
  );

  useEffect(() => {
    if (!pendingScroll) {
      return;
    }

    let cancelled = false;
    const timeoutIds = new Set<ReturnType<typeof setTimeout>>();
    const rafIds = new Set<number>();

    const clearPending = () => {
      setPendingScroll(null);
    };

    const scheduleTimeout = (callback: () => void, delay: number) => {
      const timeoutId = setTimeout(() => {
        timeoutIds.delete(timeoutId);
        callback();
      }, delay);
      timeoutIds.add(timeoutId);
    };

    const scheduleFrame = (callback: () => void) => {
      const frameId = requestAnimationFrame(() => {
        rafIds.delete(frameId);
        callback();
      });
      rafIds.add(frameId);
    };

    const attemptScroll = (retries = 0) => {
      if (cancelled) {
        return;
      }

      scheduleFrame(() => {
        scheduleFrame(() => {
          if (cancelled) {
            return;
          }

          const ok = subtitleListRef.current?.scrollToSubtitle(
            pendingScroll.uuid,
            {
              instant: pendingScroll.instant,
              center: true,
              focus: pendingScroll.instant,
            },
          );

          if (ok) {
            clearPending();
          } else if (retries < 10) {
            scheduleTimeout(() => attemptScroll(retries + 1), 50);
          } else {
            warnDev(
              "Could not center subtitle after retries:",
              pendingScroll.uuid,
            );
            clearPending();
          }
        });
      });
    };

    attemptScroll();

    return () => {
      cancelled = true;
      for (const timeoutId of timeoutIds) {
        clearTimeout(timeoutId);
      }
      for (const frameId of rafIds) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [pendingScroll, subtitleListRef]);

  return { requestScroll };
};
