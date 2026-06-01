"use client";

import type { SubtitleTrack } from "@/types/subtitle";
import { useMemo } from "react";

export const useActiveTrackDetails = (
  tracks: SubtitleTrack[],
  activeTrackId: string | null,
) =>
  useMemo(() => {
    const activeTrackIndex = activeTrackId
      ? tracks.findIndex((track) => track.id === activeTrackId)
      : -1;
    const activeTrack =
      activeTrackIndex >= 0 ? (tracks[activeTrackIndex] ?? null) : null;
    const activeTrackSubtitles = activeTrack?.subtitles ?? [];
    const activeTrackIsEmpty =
      activeTrack !== null && activeTrackSubtitles.length === 0;

    return {
      activeTrackIndex,
      activeTrack,
      activeTrackSubtitles,
      activeTrackIsEmpty,
      allowSubtitleDrop: tracks.length === 0 || activeTrackIsEmpty,
      bulkOffsetDisabled: !activeTrack || activeTrackSubtitles.length === 0,
    };
  }, [activeTrackId, tracks]);
