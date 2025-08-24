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
import type { Subtitle } from "@/types/subtitle";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

// Define the shape of the context value
interface SubtitleContextType {
  subtitles: Subtitle[];
  setInitialSubtitles: (subs: Subtitle[]) => void;
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
  updateSubtitleStartTimeAction: (id: number, newTime: string) => void;
  updateSubtitleEndTimeAction: (id: number, newTime: string) => void;
  replaceAllSubtitlesAction: (newSubtitles: Subtitle[]) => void; // For Find/Replace
  undoSubtitles: () => void;
  redoSubtitles: () => void;
  canUndoSubtitles: boolean;
  canRedoSubtitles: boolean;
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
  const [
    subtitles,
    setSubtitlesWithHistory,
    undoSubtitles,
    redoSubtitles,
    canUndoSubtitles,
    canRedoSubtitles,
  ] = useUndoableState<Subtitle[]>([]);

  // --- Action Functions (React Compiler handles memoization) ---

  const setInitialSubtitles = (subs: Subtitle[]) => {
    setSubtitlesWithHistory(subs); // Reset history when setting initial
  };

  const addSubtitleAction = (
    beforeId: number,
    afterId: number | null,
    newSubtitleText?: string
  ) => {
    setSubtitlesWithHistory((prev) =>
      addSubtitle(prev, beforeId, afterId, newSubtitleText)
    );
  };

  const deleteSubtitleAction = (id: number) => {
    setSubtitlesWithHistory((prev) => deleteSubtitle(prev, id));
  };

  const mergeSubtitlesAction = (id1: number, id2: number) => {
    setSubtitlesWithHistory((prev) => mergeSubtitles(prev, id1, id2));
  };

  const splitSubtitleAction = (
    id: number,
    caretPos: number,
    textLength: number
  ) => {
    setSubtitlesWithHistory((prev) =>
      splitSubtitle(prev, id, caretPos, textLength)
    );
  };

  const updateSubtitleTextAction = (id: number, newText: string) => {
    setSubtitlesWithHistory((prev) => updateSubtitle(prev, id, newText));
  };

  // Combined time update for WaveformVisualizer drag
  const updateSubtitleTimeAction = (
    id: number,
    newStartTime: string,
    newEndTime: string
  ) => {
    setSubtitlesWithHistory((subs) =>
      subs.map((sub) =>
        sub.id === id
          ? { ...sub, startTime: newStartTime, endTime: newEndTime }
          : sub
      )
    );
  };

  // Individual time updates for SubtitleItem inputs
  const updateSubtitleStartTimeAction = (id: number, newTime: string) => {
    setSubtitlesWithHistory(updateSubtitleStartTime(id, newTime));
  };

  const updateSubtitleEndTimeAction = (id: number, newTime: string) => {
    setSubtitlesWithHistory(updateSubtitleEndTime(id, newTime));
  };

  // Action for Find/Replace
  const replaceAllSubtitlesAction = (newSubtitles: Subtitle[]) => {
    setSubtitlesWithHistory(newSubtitles); // Treat replace all as a single undoable action
  };

  // --- Context Value ---
  const value: SubtitleContextType = {
    subtitles,
    setInitialSubtitles,
    addSubtitleAction,
    deleteSubtitleAction,
    mergeSubtitlesAction,
    splitSubtitleAction,
    updateSubtitleTextAction,
    updateSubtitleTimeAction,
    updateSubtitleStartTimeAction,
    updateSubtitleEndTimeAction,
    replaceAllSubtitlesAction,
    undoSubtitles,
    redoSubtitles,
    canUndoSubtitles,
    canRedoSubtitles,
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
