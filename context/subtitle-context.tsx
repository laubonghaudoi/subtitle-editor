"use client";

import { useUndoableState } from "@/hooks/use-undoable-state";
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
import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

// Define the shape of the context value
interface SubtitleContextType {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  setActiveTrackId: (id: string | null) => void;
  showTrackLabels: boolean;
  setShowTrackLabels: (value: boolean) => void;
  addTrack: (name: string, subtitles?: Subtitle[]) => string;
  loadSubtitlesIntoTrack: (trackId: string, subtitles: Subtitle[]) => void;
  renameTrack: (trackId: string, newName: string) => void;
  deleteTrack: (trackId: string) => void;
  setInitialSubtitles: (subs: Subtitle[], trackName?: string) => void;
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

  // Note: We are keeping a separate undo/redo history for now.
  // A more robust solution would involve a single history for all tracks.
  const [
    _subtitles, // Raw subtitles from the undoable state
    setSubtitlesWithHistory,
    undoSubtitles,
    redoSubtitles,
    canUndoSubtitles,
    canRedoSubtitles,
  ] = useUndoableState<Subtitle[]>([]);

  // CRITICAL FIX: This effect synchronizes the undo/redo state
  // with the currently active track.
  useEffect(() => {
    const activeTrack = tracks.find(track => track.id === activeTrackId);
    if (activeTrack) {
      // We use the raw `setSubtitlesWithHistory` here to update the
      // history state without creating a new undo point.
      setSubtitlesWithHistory(activeTrack.subtitles);
    }
  }, [activeTrackId, tracks, setSubtitlesWithHistory]);


  const addTrack = (name: string, subtitles: Subtitle[] = []) => {
    if (tracks.length >= 4) {
      // Here you might want to show a toast or a notification to the user
      console.warn("Maximum number of tracks (4) reached.");
      return ""; // Return empty string or handle error appropriately
    }

    const newTrackId = uuidv4();
    const newTrack: SubtitleTrack = {
      id: newTrackId,
      name,
      subtitles: subtitles.map(sub => ({ ...sub, trackId: newTrackId })),
    };
    setTracks(prev => [...prev, newTrack]);
    if (!activeTrackId) {
      setActiveTrackId(newTrackId);
    }
    return newTrackId;
  };

  const loadSubtitlesIntoTrack = (trackId: string, newSubtitles: Subtitle[]) => {
    setTracks(prevTracks =>
      prevTracks.map(track => {
        if (track.id === trackId) {
          return {
            ...track,
            subtitles: newSubtitles.map(sub => ({ ...sub, trackId })),
          };
        }
        return track;
      })
    );
    // Also update the undo/redo history if it's the active track
    if (trackId === activeTrackId) {
      setSubtitlesWithHistory(newSubtitles);
    }
  };

  const deleteTrack = (trackId: string) => {
    setTracks(prevTracks => {
      const remainingTracks = prevTracks.filter(track => track.id !== trackId);
      // If the deleted track was the active one, pick a new active track
      if (trackId === activeTrackId) {
        if (remainingTracks.length > 0) {
          setActiveTrackId(remainingTracks[0].id);
          setSubtitlesWithHistory(remainingTracks[0].subtitles);
        } else {
          setActiveTrackId(null);
          setSubtitlesWithHistory([]);
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

  const setInitialSubtitles = (subs: Subtitle[], trackName?: string) => {
    const newTrackId = addTrack(trackName || "Track 1", subs);
    setActiveTrackId(newTrackId);
    setSubtitlesWithHistory(subs); // Set history for the first track
  };

  // This is a temporary solution. In a real implementation, we would
  // likely want to manage history per-track or have a more complex history state.
  const handleTrackedStateChange = (newSubtitles: Subtitle[]) => {
    setSubtitlesWithHistory(newSubtitles);
    if (activeTrackId) {
      setTracks(prevTracks =>
        prevTracks.map(track =>
          track.id === activeTrackId
            ? { ...track, subtitles: newSubtitles }
            : track
        )
      );
    }
  };


  const addSubtitleAction = (
    beforeId: number,
    afterId: number | null,
    newSubtitleText?: string
  ) => {
    handleTrackedStateChange(addSubtitle(_subtitles, beforeId, afterId, newSubtitleText));
  };

  const deleteSubtitleAction = (id: number) => {
    handleTrackedStateChange(deleteSubtitle(_subtitles, id));
  };

  const mergeSubtitlesAction = (id1: number, id2: number) => {
    handleTrackedStateChange(mergeSubtitles(_subtitles, id1, id2));
  };

  const splitSubtitleAction = (
    id: number,
    caretPos: number,
    textLength: number
  ) => {
    handleTrackedStateChange(splitSubtitle(_subtitles, id, caretPos, textLength));
  };

  const updateSubtitleTextAction = (id: number, newText: string) => {
    handleTrackedStateChange(updateSubtitle(_subtitles, id, newText));
  };

  // Combined time update for WaveformVisualizer drag
  const updateSubtitleTimeAction = (
    id: number,
    newStartTime: string,
    newEndTime: string
  ) => {
    handleTrackedStateChange(
      _subtitles.map(sub =>
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
    setTracks(prevTracks =>
      prevTracks.map(track => ({
        ...track,
        subtitles: track.subtitles.map(sub =>
          sub.uuid === uuid
            ? { ...sub, startTime: newStartTime, endTime: newEndTime }
            : sub
        )
      }))
    );
  };

  // Individual time updates for SubtitleItem inputs
  const updateSubtitleStartTimeAction = (id: number, newTime: string) => {
    handleTrackedStateChange(updateSubtitleStartTime(id, newTime)(_subtitles));
  };

  const updateSubtitleEndTimeAction = (id: number, newTime: string) => {
    handleTrackedStateChange(updateSubtitleEndTime(id, newTime)(_subtitles));
  };

  // Action for Find/Replace
  const replaceAllSubtitlesAction = (newSubtitles: Subtitle[]) => {
    handleTrackedStateChange(newSubtitles); // Treat replace all as a single undoable action
  };

  // Get the subtitles for the active track
  const subtitles = useMemo(() => {
    if (!activeTrackId) return [];
    const activeTrack = tracks.find(t => t.id === activeTrackId);
    return activeTrack ? activeTrack.subtitles : [];
  }, [tracks, activeTrackId]);


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
