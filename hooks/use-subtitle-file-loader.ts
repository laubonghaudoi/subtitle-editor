"use client";

import type { SubtitleActions } from "@/hooks/use-subtitle-actions";
import {
  extractVttPrologue,
  parseSRT,
  parseVTT,
} from "@/lib/subtitle-operations";
import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

interface UseSubtitleFileLoaderOptions {
  activeTrackId: string | null;
  activeTrackIsEmpty: boolean;
  newSubtitleText: string;
  newTrackName: string;
  loadSubtitlesIntoTrack: SubtitleActions["loadSubtitlesIntoTrack"];
  renameTrack: SubtitleActions["renameTrack"];
  setInitialSubtitles: SubtitleActions["setInitialSubtitles"];
}

export const useSubtitleFileLoader = ({
  activeTrackId,
  activeTrackIsEmpty,
  newSubtitleText,
  newTrackName,
  loadSubtitlesIntoTrack,
  renameTrack,
  setInitialSubtitles,
}: UseSubtitleFileLoaderOptions) => {
  const loadSubtitleFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const firstLine =
        text.split(/\r?\n/).find((line) => line.trim().length > 0) || "";
      const isVtt =
        file.name.toLowerCase().endsWith(".vtt") ||
        /^WEBVTT( |$)/.test(firstLine);
      const parsedSubtitles = isVtt ? parseVTT(text) : parseSRT(text);
      const meta = isVtt ? extractVttPrologue(text) : undefined;
      const safeTrackName = file.name.replace(/\.(srt|vtt)$/i, "") || file.name;
      const trackMeta = meta
        ? { vttHeader: meta.header, vttPrologue: meta.prologue }
        : undefined;

      if (activeTrackId && activeTrackIsEmpty) {
        loadSubtitlesIntoTrack(activeTrackId, parsedSubtitles, trackMeta);
        renameTrack(activeTrackId, safeTrackName);
        return;
      }

      setInitialSubtitles(parsedSubtitles, safeTrackName, trackMeta);
    },
    [
      activeTrackId,
      activeTrackIsEmpty,
      loadSubtitlesIntoTrack,
      renameTrack,
      setInitialSubtitles,
    ],
  );

  const handleStartFromScratch = useCallback(() => {
    setInitialSubtitles(
      [
        {
          uuid: uuidv4(),
          id: 1,
          startTime: "00:00:00,000",
          endTime: "00:00:03,000",
          text: newSubtitleText,
        },
      ],
      newTrackName,
    );
  }, [newSubtitleText, newTrackName, setInitialSubtitles]);

  return {
    loadSubtitleFile,
    handleStartFromScratch,
  };
};
