import { timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import { useEffect } from "react";
import type { SubtitleTiming } from "@/lib/subtitle-lookup";

interface SubtitleListShortcutsOptions {
  subtitles: Subtitle[];
  subtitleTimings: SubtitleTiming[];
  currentTime: number;
  jumpDuration: number;
  onTimeJump: (seconds: number) => void;
  setPlaybackTime: (time: number) => void;
  mergeSubtitlesAction: (previousId: number, currentId: number) => void;
  deleteSubtitleAction: (id: number) => void;
  manualScrollRequestUuidRef: React.MutableRefObject<string | null>;
}

export function useSubtitleListShortcuts({
  subtitles,
  subtitleTimings,
  currentTime,
  jumpDuration,
  onTimeJump,
  setPlaybackTime,
  mergeSubtitlesAction,
  deleteSubtitleAction,
  manualScrollRequestUuidRef,
}: SubtitleListShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditing =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA");

      const applePlatformPattern = /Mac|iPhone|iPad|iPod/i;
      const navigatorUserAgent =
        typeof navigator !== "undefined" ? (navigator.userAgent ?? "") : "";
      const isApplePlatform = applePlatformPattern.test(navigatorUserAgent);
      const jumpModPressed = isApplePlatform ? event.metaKey : event.ctrlKey;

      if (jumpModPressed && (event.key === "j" || event.key === "l")) {
        event.preventDefault();

        if (event.key === "j") {
          onTimeJump(-jumpDuration);
        } else if (event.key === "l") {
          onTimeJump(jumpDuration);
        }
      }

      if (isEditing) {
        return;
      }

      if (event.shiftKey && event.key === "Backspace") {
        let currentIndex = subtitleTimings.findIndex(
          (timing) => timing.start <= currentTime && timing.end > currentTime,
        );

        if (currentIndex === -1) {
          currentIndex = subtitleTimings.findLastIndex(
            (timing) => timing.start <= currentTime,
          );
        }

        if (currentIndex !== -1 && currentIndex > 0) {
          event.preventDefault();
          const previousSubtitleId = subtitles[currentIndex - 1].id;
          const currentSubtitleId = subtitles[currentIndex].id;
          mergeSubtitlesAction(previousSubtitleId, currentSubtitleId);
        }
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();

        let currentIndex = subtitleTimings.findIndex(
          (timing) => timing.start <= currentTime && timing.end > currentTime,
        );

        if (currentIndex === -1) {
          currentIndex = subtitleTimings.findLastIndex(
            (timing) => timing.start <= currentTime,
          );
          if (currentIndex === -1) {
            currentIndex = 0;
          }
        }

        let targetIndex = currentIndex;
        if (event.key === "ArrowUp") {
          targetIndex = Math.max(0, currentIndex - 1);
        } else if (event.key === "ArrowDown") {
          targetIndex = Math.min(subtitles.length - 1, currentIndex + 1);
        }

        if (subtitles[targetIndex]) {
          manualScrollRequestUuidRef.current = subtitles[targetIndex].uuid;
          const targetTime = subtitleTimings[targetIndex]?.start ?? 0;
          setPlaybackTime(targetTime);
        }
      }
      if (event.key === "Delete") {
        event.preventDefault();

        let currentIndex = subtitleTimings.findIndex(
          (timing) => timing.start <= currentTime && timing.end > currentTime,
        );

        if (currentIndex === -1) {
          currentIndex = subtitleTimings.findLastIndex(
            (timing) => timing.start <= currentTime,
          );
        }

        if (currentIndex !== -1) {
          const subtitleToDelete = subtitles[currentIndex];
          deleteSubtitleAction(subtitleToDelete.id);

          const nextSubtitle = subtitles[currentIndex + 1];
          if (nextSubtitle) {
            const nextSubtitleTime = timeToSeconds(nextSubtitle.startTime);
            setPlaybackTime(nextSubtitleTime);
          } else {
            const previousSubtitle = subtitles[currentIndex - 1];
            if (previousSubtitle) {
              const previousSubtitleTime = timeToSeconds(
                previousSubtitle.startTime,
              );
              setPlaybackTime(previousSubtitleTime);
            } else {
              setPlaybackTime(0);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    subtitles,
    subtitleTimings,
    currentTime,
    setPlaybackTime,
    mergeSubtitlesAction,
    onTimeJump,
    jumpDuration,
    deleteSubtitleAction,
    manualScrollRequestUuidRef,
  ]);
}
