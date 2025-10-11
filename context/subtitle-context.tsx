"use client";

import {
  useUndoableState,
  type UndoHistory,
} from "@/hooks/use-undoable-state";
import {
  addSubtitle,
  deleteSubtitle,
  mergeSubtitles,
  splitSubtitle,
  updateSubtitle,
  updateSubtitleEndTime,
  updateSubtitleStartTime,
} from "@/lib/subtitleOperations";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

const EMPTY_HISTORY: UndoHistory<Subtitle[]> = {
  past: [],
  present: [],
  future: [],
};

const ensureTrackMetadata = (
  subtitles: Subtitle[],
  trackId: string
): Subtitle[] => {
  let mutated = false;
  const normalized = subtitles.map((subtitle) => {
    if (subtitle.trackId === trackId) {
      return subtitle;
    }
    mutated = true;
    return { ...subtitle, trackId };
  });
  return mutated ? normalized : subtitles;
};

const subtitlesAreEqual = (a: Subtitle[], b: Subtitle[]): boolean => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const prev = a[i];
    const next = b[i];
    if (
      prev.id !== next.id ||
      prev.uuid !== next.uuid ||
      prev.startTime !== next.startTime ||
      prev.endTime !== next.endTime ||
      prev.text !== next.text ||
      prev.trackId !== next.trackId
    ) {
      return false;
    }
  }
  return true;
};

const historiesAreEqual = (
  a: UndoHistory<Subtitle[]> | undefined,
  b: UndoHistory<Subtitle[]> | undefined
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.past.length !== b.past.length || a.future.length !== b.future.length) {
    return false;
  }
  for (let i = 0; i < a.past.length; i++) {
    if (!subtitlesAreEqual(a.past[i], b.past[i])) {
      return false;
    }
  }
  if (!subtitlesAreEqual(a.present, b.present)) {
    return false;
  }
  for (let i = 0; i < a.future.length; i++) {
    if (!subtitlesAreEqual(a.future[i], b.future[i])) {
      return false;
    }
  }
  return true;
};

const isHistoryEmpty = (history: UndoHistory<Subtitle[]>) =>
  history.past.length === 0 &&
  history.present.length === 0 &&
  history.future.length === 0;

const createTrackHistory = (
  trackId: string,
  subtitles: Subtitle[]
): UndoHistory<Subtitle[]> => {
  const normalized = ensureTrackMetadata(subtitles, trackId);
  return {
    past: [],
    present: normalized,
    future: [],
  };
};

// Define the shape of the context value
interface SubtitleContextType {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  setActiveTrackId: (id: string | null) => void;
  showTrackLabels: boolean;
  setShowTrackLabels: (value: boolean) => void;
  addTrack: (
    name: string,
    subtitles?: Subtitle[],
    meta?: { vttHeader?: string; vttPrologue?: string[] }
  ) => string | null;
  loadSubtitlesIntoTrack: (
    trackId: string,
    subtitles: Subtitle[],
    meta?: { vttHeader?: string; vttPrologue?: string[] }
  ) => void;
  renameTrack: (trackId: string, newName: string) => void;
  deleteTrack: (trackId: string) => void;
  setInitialSubtitles: (
    subs: Subtitle[],
    trackName?: string,
    meta?: { vttHeader?: string; vttPrologue?: string[] }
  ) => void;
  addSubtitleAction: (
    beforeId: number,
    afterId: number | null,
    newSubtitleText?: string
  ) => void;
  deleteSubtitleAction: (id: number) => void;
  mergeSubtitlesAction: (id1: number, id2: number) => void;
  splitSubtitleAction: (
    id: number,
    caretPos: number,
    textLength: number
  ) => void;
  updateSubtitleTextAction: (id: number, newText: string) => void;
  updateSubtitleTimeAction: (
    id: number,
    newStartTime: string,
    newEndTime: string
  ) => void;
  updateSubtitleTimeByUuidAction: (
    uuid: string,
    newStartTime: string,
    newEndTime: string
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
  undefined
);

// Create the provider component
interface SubtitleProviderProps {
  children: ReactNode;
}

export const SubtitleProvider: React.FC<SubtitleProviderProps> = ({
  children,
}) => {
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [showTrackLabels, setShowTrackLabels] = useState<boolean>(false);
  const previousActiveTrackId = useRef<string | null>(null);
  const trackHistoriesRef = useRef<
    Map<string, UndoHistory<Subtitle[]>>
  >(new Map());

  // Each track keeps an independent undo/redo history stored alongside the track list.
  const [
    activeSubtitles, // Raw subtitles from the undoable state
    setSubtitlesWithHistory,
    /* skip replaceState */,
    undoSubtitles,
    redoSubtitles,
    canUndoSubtitles,
    canRedoSubtitles,
    getHistorySnapshot,
    setHistorySnapshot,
  ] = useUndoableState<Subtitle[]>([], {
    isEqual: subtitlesAreEqual,
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
        activeTrack ? activeTrack.subtitles : []
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


  const addTrack = (
    name: string,
    subtitles: Subtitle[] = [],
    meta?: { vttHeader?: string; vttPrologue?: string[] }
  ): string | null => {
    if (tracks.length >= 4) {
      // Here you might want to show a toast or a notification to the user
      console.warn("Maximum number of tracks (4) reached.");
      return null; // Return null to signal failure
    }

    const newTrackId = uuidv4();
    const history = createTrackHistory(newTrackId, subtitles);
    const newTrack: SubtitleTrack = {
      id: newTrackId,
      name,
      subtitles: history.present,
      vttHeader: meta?.vttHeader,
      vttPrologue: meta?.vttPrologue,
    };
    setTracks(prev => [...prev, newTrack]);
    trackHistoriesRef.current.set(newTrackId, history);
    if (!activeTrackId) {
      setActiveTrackId(newTrackId);
      setHistorySnapshot(history);
    }
    return newTrackId;
  };

  const loadSubtitlesIntoTrack = (
    trackId: string,
    newSubtitles: Subtitle[],
    meta?: { vttHeader?: string; vttPrologue?: string[] }
  ) => {
    const history = createTrackHistory(trackId, newSubtitles);
    trackHistoriesRef.current.set(trackId, history);
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          return {
            ...track,
            subtitles: history.present,
            vttHeader: meta?.vttHeader ?? track.vttHeader,
            vttPrologue: meta?.vttPrologue ?? track.vttPrologue,
          };
        }
        return track;
      })
    );
    if (trackId === activeTrackId) {
      setHistorySnapshot(history);
    }
  };

  const deleteTrack = (trackId: string) => {
    trackHistoriesRef.current.delete(trackId);
    setTracks((prevTracks) => {
      const remainingTracks = prevTracks.filter((track) => track.id !== trackId);
      if (trackId === activeTrackId) {
        if (remainingTracks.length > 0) {
          setActiveTrackId(remainingTracks[0].id);
        } else {
          setActiveTrackId(null);
          setHistorySnapshot(EMPTY_HISTORY);
        }
      }
      return remainingTracks;
    });
  };

  const renameTrack = (trackId: string, newName: string) => {
    setTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === trackId ? { ...track, name: newName } : track
      )
    );
  };

  // --- Action Functions (React Compiler handles memoization) ---

  const setInitialSubtitles = (
    subs: Subtitle[],
    trackName?: string,
    meta?: { vttHeader?: string; vttPrologue?: string[] }
  ) => {
    const newTrackId = addTrack(trackName || "Track 1", subs, meta);
    if (!newTrackId) return;
    if (activeTrackId) {
      trackHistoriesRef.current.set(activeTrackId, getHistorySnapshot());
    }
    setActiveTrackId(newTrackId);
    const seededHistory = trackHistoriesRef.current.get(newTrackId);
    if (seededHistory) {
      setHistorySnapshot(seededHistory);
    } else {
      const fallbackHistory = createTrackHistory(newTrackId, subs);
      trackHistoriesRef.current.set(newTrackId, fallbackHistory);
      setHistorySnapshot(fallbackHistory);
    }
  };

  // Central helper to fan-out subtitle mutations into undo history + track state.
  const handleTrackedStateChange = (newSubtitles: Subtitle[]) => {
    if (!activeTrackId) {
      setSubtitlesWithHistory(newSubtitles);
      return;
    }

    const normalized = ensureTrackMetadata(newSubtitles, activeTrackId);
    setSubtitlesWithHistory(normalized);
    setTracks((prevTracks) =>
      prevTracks.map((track) =>
        track.id === activeTrackId ? { ...track, subtitles: normalized } : track
      )
    );
  };


  const addSubtitleAction = (
    beforeId: number,
    afterId: number | null,
    newSubtitleText?: string
  ) => {
    handleTrackedStateChange(
      addSubtitle(activeSubtitles, beforeId, afterId, newSubtitleText)
    );
  };

  const deleteSubtitleAction = (id: number) => {
    handleTrackedStateChange(deleteSubtitle(activeSubtitles, id));
  };

  const mergeSubtitlesAction = (id1: number, id2: number) => {
    handleTrackedStateChange(mergeSubtitles(activeSubtitles, id1, id2));
  };

  const splitSubtitleAction = (
    id: number,
    caretPos: number,
    textLength: number
  ) => {
    handleTrackedStateChange(
      splitSubtitle(activeSubtitles, id, caretPos, textLength)
    );
  };

  const updateSubtitleTextAction = (id: number, newText: string) => {
    handleTrackedStateChange(updateSubtitle(activeSubtitles, id, newText));
  };

  // Combined time update for WaveformVisualizer drag
  const updateSubtitleTimeAction = (
    id: number,
    newStartTime: string,
    newEndTime: string
  ) => {
    handleTrackedStateChange(
      activeSubtitles.map((sub) =>
        sub.id === id
          ? { ...sub, startTime: newStartTime, endTime: newEndTime }
          : sub
      )
    );
  };

  // Update subtitle time by UUID across all tracks
  const updateSubtitleTimeByUuidAction = (
    uuid: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    let updatedActiveTrackSubtitles: Subtitle[] | null = null;

    setTracks(prevTracks =>
      prevTracks.map(track => {
        let hasChanges = false;
        const subtitles = track.subtitles.map(sub => {
          if (sub.uuid === uuid) {
            hasChanges = true;
            return {
              ...sub,
              startTime: newStartTime,
              endTime: newEndTime,
            };
          }
          return sub;
        });

        if (hasChanges) {
          if (track.id === activeTrackId) {
            updatedActiveTrackSubtitles = subtitles;
          }
          return {
            ...track,
            subtitles,
          };
        }

        return track;
      })
    );

    if (updatedActiveTrackSubtitles) {
      setSubtitlesWithHistory(updatedActiveTrackSubtitles);
    }
  };

  // Individual time updates for SubtitleItem inputs
  const updateSubtitleStartTimeAction = (id: number, newTime: string) => {
    handleTrackedStateChange(
      updateSubtitleStartTime(id, newTime)(activeSubtitles)
    );
  };

  const updateSubtitleEndTimeAction = (id: number, newTime: string) => {
    handleTrackedStateChange(
      updateSubtitleEndTime(id, newTime)(activeSubtitles)
    );
  };

  // Action for Find/Replace
  const replaceAllSubtitlesAction = (newSubtitles: Subtitle[]) => {
    handleTrackedStateChange(newSubtitles); // Treat replace all as a single undoable action
  };

  // Get the subtitles for the active track
  const subtitles = activeSubtitles;


  // --- Context Value ---
  const value: SubtitleContextType = {
    tracks,
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
  };

  return (
    <SubtitleContext.Provider value={value}>
      {children}
    </SubtitleContext.Provider>
  );
};

// Create a custom hook for consuming the context
export const useSubtitleContext = (): SubtitleContextType => {
  const context = useContext(SubtitleContext);
  if (context === undefined) {
    throw new Error(
      "useSubtitleContext must be used within a SubtitleProvider"
    );
  }
  return context;
};
