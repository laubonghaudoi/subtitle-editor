import { findActiveSubtitleIndex, type SubtitleTiming } from "@/lib/subtitle-lookup";
import type { Subtitle } from "@/types/subtitle";
import { useCallback, useEffect, useRef } from "react";

interface SubtitleAutoScrollOptions {
  listRef: React.RefObject<HTMLDivElement | null>;
  subtitles: Subtitle[];
  subtitleTimings: SubtitleTiming[];
  currentTime: number;
  isPlaying: boolean;
  editingSubtitleUuid: string | null;
  activeSubtitleRef: React.MutableRefObject<string | null>;
  suppressAutoCenterUuidRef: React.MutableRefObject<string | null>;
  manualScrollRequestUuidRef: React.MutableRefObject<string | null>;
}

export function useSubtitleAutoScroll({
  listRef,
  subtitles,
  subtitleTimings,
  currentTime,
  isPlaying,
  editingSubtitleUuid,
  activeSubtitleRef,
  suppressAutoCenterUuidRef,
  manualScrollRequestUuidRef,
}: SubtitleAutoScrollOptions) {
  const activeSubtitleIndexRef = useRef<number>(-1);

  useEffect(() => {
    activeSubtitleIndexRef.current = -1;
  }, [subtitleTimings]);

  const findSubtitleIndexForTime = useCallback(
    (time: number) => {
      const resolved = findActiveSubtitleIndex(
        subtitleTimings,
        time,
        activeSubtitleIndexRef.current,
      );
      activeSubtitleIndexRef.current = resolved;
      return resolved;
    },
    [subtitleTimings],
  );

  useEffect(() => {
    if (!listRef.current) return;

    const activeIndex = findSubtitleIndexForTime(currentTime);
    if (activeIndex < 0 || activeIndex >= subtitles.length) {
      manualScrollRequestUuidRef.current = null;
      return;
    }

    const currentSubtitle = subtitles[activeIndex];
    const currentUuid = currentSubtitle.uuid;
    const manualOverride = manualScrollRequestUuidRef.current === currentUuid;
    const clearManualOverride = () => {
      if (manualOverride) {
        manualScrollRequestUuidRef.current = null;
      }
    };

    if (editingSubtitleUuid && !manualOverride) {
      return;
    }

    if (!isPlaying && !manualOverride) {
      return;
    }

    if (suppressAutoCenterUuidRef.current === currentUuid && !manualOverride) {
      activeSubtitleRef.current = currentUuid;
      suppressAutoCenterUuidRef.current = null;
      clearManualOverride();
      return;
    }

    if (suppressAutoCenterUuidRef.current === currentUuid) {
      suppressAutoCenterUuidRef.current = null;
    }

    if (currentUuid === activeSubtitleRef.current && !manualOverride) {
      clearManualOverride();
      return;
    }

    const subtitleElement = document.getElementById(`subtitle-${currentUuid}`);
    const container = listRef.current;
    if (subtitleElement && container && container.contains(subtitleElement)) {
      const cRect = container.getBoundingClientRect();
      const iRect = subtitleElement.getBoundingClientRect();
      const centerY = cRect.top + container.clientHeight / 2;
      const itemCenterY = iRect.top + iRect.height / 2;
      const offBy = Math.abs(itemCenterY - centerY);
      if (offBy > 4 || manualOverride) {
        subtitleElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      activeSubtitleRef.current = currentUuid;
    }

    clearManualOverride();
  }, [
    currentTime,
    subtitles,
    isPlaying,
    editingSubtitleUuid,
    findSubtitleIndexForTime,
    listRef,
    manualScrollRequestUuidRef,
    activeSubtitleRef,
    suppressAutoCenterUuidRef,
  ]);
}
