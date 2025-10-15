"use client";

import { useSubtitlePersistence } from "@/hooks/use-subtitle-persistence";
import { useSubtitleActions } from "@/hooks/use-subtitle-actions";
import { useUndoableState, type UndoHistory } from "@/hooks/use-undoable-state";
import {
  createTrackHistory,
  historiesAreEqual,
  isHistoryEmpty,
  subtitlesAreEqual,
  EMPTY_HISTORY,
} from "@/lib/subtitle-history";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import type { ReactNode } from "react";
import {
  createContext,
  createElement,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

// Define the shape of the context value
interface SubtitleContextType {
  tracks: SubtitleTrack[];
  trackCount: number;
  hasMultipleTracks: boolean;
  activeTrack: SubtitleTrack | null;
  getTrackById: (id: string) => SubtitleTrack | undefined;
  activeTrackId: string | null;
  setActiveTrackId: (id: string | null) => void;
  showTrackLabels: boolean;
  setShowTrackLabels: (value: boolean) => void;
  addTrack: (
    name: string,
    subtitles?: Subtitle[],
    meta?: { vttHeader?: string; vttPrologue?: string[] },
  ) => string | null;
  loadSubtitlesIntoTrack: (
    trackId: string,
    subtitles: Subtitle[],
    meta?: { vttHeader?: string; vttPrologue?: string[] },
  ) => void;
  renameTrack: (trackId: string, newName: string) => void;
  deleteTrack: (trackId: string) => void;
  setInitialSubtitles: (
    subs: Subtitle[],
    trackName?: string,
    meta?: { vttHeader?: string; vttPrologue?: string[] },
  ) => void;
  addSubtitleAction: (
    beforeId: number,
    afterId: number | null,
    newSubtitleText?: string,
  ) => void;
  deleteSubtitleAction: (id: number) => void;
  mergeSubtitlesAction: (id1: number, id2: number) => void;
  splitSubtitleAction: (
    id: number,
    caretPos: number,
    textLength: number,
    pendingText?: string,
  ) => void;
  updateSubtitleTextAction: (id: number, newText: string) => void;
  updateSubtitleTimeAction: (
    id: number,
    newStartTime: string,
    newEndTime: string,
  ) => void;
  updateSubtitleTimeByUuidAction: (
    uuid: string,
    newStartTime: string,
    newEndTime: string,
  ) => void;
  updateSubtitleStartTimeAction: (id: number, newTime: string) => void;
  updateSubtitleEndTimeAction: (id: number, newTime: string) => void;
  replaceAllSubtitlesAction: (newSubtitles: Subtitle[]) => void; // For Find/Replace
  undoSubtitles: () => void;
  redoSubtitles: () => void;
  canUndoSubtitles: boolean;
  canRedoSubtitles: boolean;
  // Get the subtitles of the active track
  subtitles: Subtitle[];
}

// Create the context with a default value (or null/undefined and check in consumer)
const SubtitleContext = createContext<SubtitleContextType | undefined>(
  undefined,
);

// Create the provider component
interface SubtitleProviderProps {
  children: ReactNode;
}

export function SubtitleProvider({ children }: SubtitleProviderProps) {
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [showTrackLabels, setShowTrackLabels] = useState<boolean>(false);
  const previousActiveTrackId = useRef<string | null>(null);
  const trackHistoriesRef = useRef<Map<string, UndoHistory<Subtitle[]>>>(
    new Map(),
  );

  // Each track keeps an independent undo/redo history stored alongside the track list.
  const [
    activeSubtitles, // Raw subtitles from the undoable state
    setSubtitlesWithHistory,
    ,
    /* skip replaceState */ undoSubtitles,
    redoSubtitles,
    canUndoSubtitles,
    canRedoSubtitles,
    getHistorySnapshot,
    setHistorySnapshot,
  ] = useUndoableState<Subtitle[]>([], {
    isEqual: subtitlesAreEqual,
  });

  useSubtitlePersistence({
    tracks,
    activeTrackId,
    showTrackLabels,
    setTracks,
    setActiveTrackId,
    setShowTrackLabels,
    trackHistoriesRef,
    previousActiveTrackId,
    setHistorySnapshot,
  });

  // CRITICAL FIX: This effect synchronizes the undo/redo state
  // with the currently active track.
  useEffect(() => {
    const snapshot = getHistorySnapshot();
    const previousId = previousActiveTrackId.current;

    if (previousId && previousId !== activeTrackId) {
      trackHistoriesRef.current.set(previousId, snapshot);
    }

    if (!activeTrackId) {
      previousActiveTrackId.current = null;
      if (!isHistoryEmpty(snapshot)) {
        setHistorySnapshot(EMPTY_HISTORY);
      }
      return;
    }

    const cachedHistory = trackHistoriesRef.current.get(activeTrackId);

    if (!cachedHistory) {
      const activeTrack = tracks.find((track) => track.id === activeTrackId);
      const seededHistory = createTrackHistory(
        activeTrackId,
        activeTrack ? activeTrack.subtitles : [],
      );
      trackHistoriesRef.current.set(activeTrackId, seededHistory);
      if (!historiesAreEqual(seededHistory, snapshot)) {
        setHistorySnapshot(seededHistory);
      }
      previousActiveTrackId.current = activeTrackId;
      return;
    }

    if (previousId === activeTrackId) {
      if (!historiesAreEqual(cachedHistory, snapshot)) {
        trackHistoriesRef.current.set(activeTrackId, snapshot);
      }
      previousActiveTrackId.current = activeTrackId;
      return;
    }

    if (!historiesAreEqual(cachedHistory, snapshot)) {
      setHistorySnapshot(cachedHistory);
    }
    previousActiveTrackId.current = activeTrackId;
  }, [activeTrackId, getHistorySnapshot, setHistorySnapshot, tracks]);

  useEffect(() => {
    if (!activeTrackId) return;
    setTracks((prevTracks) => {
      let hasChanges = false;
      const nextTracks = prevTracks.map((track) => {
        if (track.id !== activeTrackId) {
          return track;
        }
        if (track.subtitles === activeSubtitles) {
          return track;
        }
        hasChanges = true;
        return {
          ...track,
          subtitles: activeSubtitles,
        };
      });
      return hasChanges ? nextTracks : prevTracks;
    });
  }, [activeTrackId, activeSubtitles]);

  const {
    addTrack,
    loadSubtitlesIntoTrack,
    renameTrack,
    deleteTrack,
    setInitialSubtitles,
    addSubtitleAction,
    deleteSubtitleAction,
    mergeSubtitlesAction,
    splitSubtitleAction,
    updateSubtitleTextAction,
    updateSubtitleTimeAction,
    updateSubtitleTimeByUuidAction,
    updateSubtitleStartTimeAction,
    updateSubtitleEndTimeAction,
    replaceAllSubtitlesAction,
  } = useSubtitleActions({
    tracks,
    activeTrackId,
    setTracks,
    setActiveTrackId,
    trackHistoriesRef,
    getHistorySnapshot,
    setHistorySnapshot,
    activeSubtitles,
    setSubtitlesWithHistory,
  });

  const activeTrack = useMemo(() => {
    if (!activeTrackId) {
      return null;
    }
    return tracks.find((track) => track.id === activeTrackId) ?? null;
  }, [tracks, activeTrackId]);

  const trackCount = tracks.length;
  const hasMultipleTracks = trackCount > 1;

  const getTrackById = useCallback(
    (id: string) => tracks.find((track) => track.id === id),
    [tracks],
  );

  // Get the subtitles for the active track
  const subtitles = activeSubtitles;

  // --- Context Value ---
  const value = useMemo<SubtitleContextType>(
    () => ({
      tracks,
      trackCount,
      hasMultipleTracks,
      activeTrack,
      getTrackById,
      activeTrackId,
      setActiveTrackId,
      showTrackLabels,
      setShowTrackLabels,
      addTrack,
      loadSubtitlesIntoTrack,
      renameTrack,
      deleteTrack,
      setInitialSubtitles,
      addSubtitleAction,
      deleteSubtitleAction,
      mergeSubtitlesAction,
      splitSubtitleAction,
      updateSubtitleTextAction,
      updateSubtitleTimeAction,
      updateSubtitleTimeByUuidAction,
      updateSubtitleStartTimeAction,
      updateSubtitleEndTimeAction,
      replaceAllSubtitlesAction,
      undoSubtitles,
      redoSubtitles,
      canUndoSubtitles,
      canRedoSubtitles,
      subtitles,
    }),
    [
      tracks,
      trackCount,
      hasMultipleTracks,
      activeTrack,
      getTrackById,
      activeTrackId,
      setActiveTrackId,
      showTrackLabels,
      setShowTrackLabels,
      addTrack,
      loadSubtitlesIntoTrack,
      renameTrack,
      deleteTrack,
      setInitialSubtitles,
      addSubtitleAction,
      deleteSubtitleAction,
      mergeSubtitlesAction,
      splitSubtitleAction,
      updateSubtitleTextAction,
      updateSubtitleTimeAction,
      updateSubtitleTimeByUuidAction,
      updateSubtitleStartTimeAction,
      updateSubtitleEndTimeAction,
      replaceAllSubtitlesAction,
      undoSubtitles,
      redoSubtitles,
      canUndoSubtitles,
      canRedoSubtitles,
      subtitles,
    ],
  );

  return createElement(SubtitleContext.Provider, { value }, children);
}

// Create a custom hook for consuming the context
export const useSubtitleContext = (): SubtitleContextType => {
  const context = useContext(SubtitleContext);
  if (context === undefined) {
    throw new Error(
      "useSubtitleContext must be used within a SubtitleProvider",
    );
  }
  return context;
};
