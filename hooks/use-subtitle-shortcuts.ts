"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { timeToSeconds } from "@/lib/utils";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";

interface SubtitleShortcutsOptions {
  subtitles: Subtitle[];
  playbackTime: number;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setEditingSubtitleUuid: Dispatch<SetStateAction<string | null>>;
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  setActiveTrackId: (trackId: string) => void;
  canUndoSubtitles: boolean;
  canRedoSubtitles: boolean;
  undoSubtitles: () => void;
  redoSubtitles: () => void;
}

export function useSubtitleShortcuts({
  subtitles,
  playbackTime,
  setIsPlaying,
  setEditingSubtitleUuid,
  tracks,
  activeTrackId,
  setActiveTrackId,
  canUndoSubtitles,
  canRedoSubtitles,
  undoSubtitles,
  redoSubtitles,
}: SubtitleShortcutsOptions) {
  useEffect(() => {
    const handlePlaybackKeys = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setIsPlaying((previous) => !previous);
        return;
      }

      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        const currentSubtitle = subtitles.find((sub) => {
          const startTimeSeconds = timeToSeconds(sub.startTime);
          const endTimeSeconds = timeToSeconds(sub.endTime);
          return (
            playbackTime >= startTimeSeconds && playbackTime < endTimeSeconds
          );
        });

        if (currentSubtitle) {
          setEditingSubtitleUuid(currentSubtitle.uuid);
        }
      }
    };

    window.addEventListener("keydown", handlePlaybackKeys);
    return () => window.removeEventListener("keydown", handlePlaybackKeys);
  }, [playbackTime, setEditingSubtitleUuid, setIsPlaying, subtitles]);

  useEffect(() => {
    const handleTrackSwitch = (event: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (!event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }

      let index = -1;
      if (event.code.startsWith("Digit")) {
        const n = Number.parseInt(event.code.replace("Digit", ""), 10);
        if (Number.isInteger(n) && n >= 1 && n <= 4) {
          index = n - 1;
        }
      } else if (event.key >= "1" && event.key <= "4") {
        index = Number.parseInt(event.key, 10) - 1;
      }

      if (index >= 0 && index < tracks.length) {
        event.preventDefault();
        const targetTrack = tracks[index];
        if (targetTrack && targetTrack.id !== activeTrackId) {
          setActiveTrackId(targetTrack.id);
        }
      }
    };

    window.addEventListener("keydown", handleTrackSwitch);
    return () => window.removeEventListener("keydown", handleTrackSwitch);
  }, [activeTrackId, setActiveTrackId, tracks]);

  useEffect(() => {
    const handleUndoRedo = (event: KeyboardEvent) => {
      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      if (modKey && !event.shiftKey && event.key.toLowerCase() === "z") {
        if (canUndoSubtitles) {
          event.preventDefault();
          undoSubtitles();
        }
        return;
      }

      if (modKey && event.shiftKey && event.key.toLowerCase() === "z") {
        if (canRedoSubtitles) {
          event.preventDefault();
          redoSubtitles();
        }
      }
    };

    window.addEventListener("keydown", handleUndoRedo);
    return () => window.removeEventListener("keydown", handleUndoRedo);
  }, [
    canRedoSubtitles,
    canUndoSubtitles,
    redoSubtitles,
    undoSubtitles,
  ]);
}
