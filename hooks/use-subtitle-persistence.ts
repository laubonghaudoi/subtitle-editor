"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  createTrackHistory,
  ensureTrackMetadata,
  EMPTY_HISTORY,
} from "@/lib/subtitle-history";
import type { UndoHistory } from "@/hooks/use-undoable-state";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";

const STORAGE_KEY = "subtitle-editor-state-v1";
const STORAGE_VERSION = 1;

interface StoredState {
  version: number;
  tracks: unknown;
  activeTrackId: string | null | undefined;
  showTrackLabels: boolean | undefined;
}

interface UseSubtitlePersistenceParams {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  showTrackLabels: boolean;
  setTracks: Dispatch<SetStateAction<SubtitleTrack[]>>;
  setActiveTrackId: (id: string | null) => void;
  setShowTrackLabels: (value: boolean) => void;
  trackHistoriesRef: React.MutableRefObject<Map<string, UndoHistory<Subtitle[]>>>;
  previousActiveTrackId: React.MutableRefObject<string | null>;
  setHistorySnapshot: (history: UndoHistory<Subtitle[]>) => void;
}

const isPersistenceDisabled = (): boolean => {
  if (typeof window !== "undefined") {
    const userAgent = window.navigator?.userAgent ?? "";
    if (userAgent.toLowerCase().includes("jsdom")) {
      return true;
    }
  }
  return (
    typeof process !== "undefined" && process.env.NODE_ENV === "test"
  );
};

const sanitizePersistedSubtitle = (
  subtitle: unknown,
  index: number,
  trackId: string,
): Subtitle | null => {
  if (!subtitle || typeof subtitle !== "object") {
    return null;
  }

  const partial = subtitle as Partial<Subtitle>;
  const startTime =
    typeof partial.startTime === "string" ? partial.startTime : "00:00:00,000";
  const endTime =
    typeof partial.endTime === "string" ? partial.endTime : "00:00:00,000";
  const text = typeof partial.text === "string" ? partial.text : "";
  const numericId =
    typeof partial.id === "number" && !Number.isNaN(partial.id)
      ? partial.id
      : index + 1;
  const uuid =
    typeof partial.uuid === "string" && partial.uuid.length > 0
      ? partial.uuid
      : uuidv4();

  return {
    id: numericId,
    uuid,
    startTime,
    endTime,
    text,
    trackId: partial.trackId ?? trackId,
  };
};

const sanitizePersistedTracks = (rawTracks: unknown): SubtitleTrack[] => {
  if (!Array.isArray(rawTracks)) {
    return [];
  }

  return rawTracks
    .map((candidate): SubtitleTrack | null => {
      if (!candidate || typeof candidate !== "object") {
        return null;
      }

      const track = candidate as Partial<SubtitleTrack>;
      if (typeof track.id !== "string" || typeof track.name !== "string") {
        return null;
      }
      if (!Array.isArray(track.subtitles)) {
        return null;
      }

      const sanitizedSubtitles = track.subtitles
        .map((subtitle, index) =>
          sanitizePersistedSubtitle(subtitle, index, track.id!),
        )
        .filter((subtitle): subtitle is Subtitle => subtitle !== null);

      const normalized: SubtitleTrack = {
        id: track.id,
        name: track.name,
        subtitles: ensureTrackMetadata(sanitizedSubtitles, track.id),
      };

      if (typeof track.vttHeader === "string") {
        normalized.vttHeader = track.vttHeader;
      }

      if (Array.isArray(track.vttPrologue)) {
        normalized.vttPrologue = track.vttPrologue.filter(
          (line): line is string => typeof line === "string",
        );
      }

      return normalized;
    })
    .filter((track): track is SubtitleTrack => track !== null)
    .slice(0, 4);
};

const serializeTracks = (tracks: SubtitleTrack[]) =>
  tracks.map((track) => ({
    id: track.id,
    name: track.name,
    subtitles: ensureTrackMetadata(track.subtitles, track.id).map(
      (subtitle, index) => ({
        ...subtitle,
        id:
          typeof subtitle.id === "number" && !Number.isNaN(subtitle.id)
            ? subtitle.id
            : index + 1,
        trackId: subtitle.trackId ?? track.id,
      }),
    ),
    vttHeader: track.vttHeader,
    vttPrologue: track.vttPrologue,
  }));

type SerializedTracks = ReturnType<typeof serializeTracks>;

interface PersistedState {
  version: number;
  tracks: SerializedTracks;
  activeTrackId: string | null;
  showTrackLabels: boolean;
}

export const useSubtitlePersistence = ({
  tracks,
  activeTrackId,
  showTrackLabels,
  setTracks,
  setActiveTrackId,
  setShowTrackLabels,
  trackHistoriesRef,
  previousActiveTrackId,
  setHistorySnapshot,
}: UseSubtitlePersistenceParams) => {
  const hasHydratedRef = useRef(false);
  const skipPersistRef = useRef(true);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    if (isPersistenceDisabled()) return;
    if (typeof window === "undefined") return;
    hasHydratedRef.current = true;

    const rawState = window.localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
      return;
    }

    try {
      const stored = JSON.parse(rawState) as StoredState;
      if (stored.version !== STORAGE_VERSION) {
        return;
      }

      const normalizedTracks = sanitizePersistedTracks(stored.tracks);
      if (normalizedTracks.length === 0) {
        return;
      }

      const trackHistoryMap = new Map<string, UndoHistory<Subtitle[]>>();
      normalizedTracks.forEach((track) => {
        trackHistoryMap.set(
          track.id,
          createTrackHistory(track.id, track.subtitles),
        );
      });
      trackHistoriesRef.current = trackHistoryMap;

      setTracks(normalizedTracks);
      setShowTrackLabels(Boolean(stored.showTrackLabels));

      const fallbackActiveId =
        (stored.activeTrackId &&
          normalizedTracks.some((track) => track.id === stored.activeTrackId) &&
          stored.activeTrackId) ||
        normalizedTracks[0]?.id ||
        null;

      setActiveTrackId(fallbackActiveId);
      if (fallbackActiveId) {
        previousActiveTrackId.current = fallbackActiveId;
      }

      const activeHistory =
        (fallbackActiveId && trackHistoryMap.get(fallbackActiveId)) ||
        EMPTY_HISTORY;
      setHistorySnapshot(activeHistory);
    } catch (error) {
      console.warn(
        "[pwa] Failed to hydrate editor state from local storage",
        error,
      );
    }
  }, [
    setActiveTrackId,
    setHistorySnapshot,
    setShowTrackLabels,
    setTracks,
    trackHistoriesRef,
    previousActiveTrackId,
  ]);

  useEffect(() => {
    if (isPersistenceDisabled()) return;
    if (typeof window === "undefined") return;

    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    const serializedTracks = serializeTracks(tracks);

    const payload: PersistedState = {
      version: STORAGE_VERSION,
      tracks: serializedTracks,
      activeTrackId,
      showTrackLabels,
    };

    try {
      if (serializedTracks.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      console.warn("[pwa] Failed to persist editor state", error);
    }
  }, [tracks, activeTrackId, showTrackLabels]);
};
