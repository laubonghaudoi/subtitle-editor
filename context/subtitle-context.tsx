"use client";
import {
  useSubtitleActions,
  type SubtitleActions,
} from "@/hooks/use-subtitle-actions";
import { useUndoableState, type UndoHistory } from "@/hooks/use-undoable-state";
import {
  createTrackHistory,
  historiesAreEqual,
  isHistoryEmpty,
  subtitlesAreEqual,
  EMPTY_HISTORY,
} from "@/lib/subtitle-history";
import { timeToSeconds } from "@/lib/utils";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

interface SubtitleStateValue {
  tracks: SubtitleTrack[];
  trackCount: number;
  hasMultipleTracks: boolean;
  activeTrack: SubtitleTrack | null;
  getTrackById: (id: string) => SubtitleTrack | undefined;
  activeTrackId: string | null;
  setActiveTrackId: (id: string | null) => void;
  showTrackLabels: boolean;
  setShowTrackLabels: (value: boolean) => void;
  clampOverlaps: boolean;
  setClampOverlaps: (value: boolean) => void;
}

interface SubtitleHistoryValue {
  undoSubtitles: () => void;
  redoSubtitles: () => void;
  canUndoSubtitles: boolean;
  canRedoSubtitles: boolean;
}

type SubtitleContextType = SubtitleStateValue &
  SubtitleActions &
  SubtitleHistoryValue & {
    subtitles: Subtitle[];
  };

interface SubtitleTimingEntry {
  uuid: string;
  start: number;
  end: number;
}

interface SubtitleTimingState {
  list: SubtitleTimingEntry[];
  byUuid: Map<string, SubtitleTimingEntry>;
}

const SubtitleStateContext = createContext<SubtitleStateValue | undefined>(
  undefined,
);
const SubtitleActionsContext = createContext<SubtitleActions | undefined>(
  undefined,
);
const SubtitleHistoryContext = createContext<SubtitleHistoryValue | undefined>(
  undefined,
);
const SubtitleDataContext = createContext<Subtitle[] | undefined>(undefined);
const SubtitleTimingContext = createContext<SubtitleTimingState | undefined>(
  undefined,
);

interface SubtitleProviderProps {
  children: ReactNode;
}

export function SubtitleProvider({ children }: SubtitleProviderProps) {
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [showTrackLabels, setShowTrackLabels] = useState<boolean>(false);
  const [clampOverlaps, setClampOverlaps] = useState<boolean>(true);
  const previousActiveTrackId = useRef<string | null>(null);
  const trackHistoriesRef = useRef<Map<string, UndoHistory<Subtitle[]>>>(
    new Map(),
  );

  const [
    activeSubtitles,
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

  const subtitleActions = useSubtitleActions({
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

  const stateValue = useMemo<SubtitleStateValue>(
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
      clampOverlaps,
      setClampOverlaps,
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
      clampOverlaps,
      setClampOverlaps,
    ],
  );

  const historyValue = useMemo<SubtitleHistoryValue>(
    () => ({
      undoSubtitles,
      redoSubtitles,
      canUndoSubtitles,
      canRedoSubtitles,
    }),
    [undoSubtitles, redoSubtitles, canUndoSubtitles, canRedoSubtitles],
  );

  const timingState = useMemo<SubtitleTimingState>(() => {
    const list = activeSubtitles.map((subtitle) => ({
      uuid: subtitle.uuid,
      start: timeToSeconds(subtitle.startTime),
      end: timeToSeconds(subtitle.endTime),
    }));
    const byUuid = new Map(list.map((entry) => [entry.uuid, entry]));
    return { list, byUuid };
  }, [activeSubtitles]);

  return (
    <SubtitleActionsContext.Provider value={subtitleActions}>
      <SubtitleHistoryContext.Provider value={historyValue}>
        <SubtitleStateContext.Provider value={stateValue}>
          <SubtitleTimingContext.Provider value={timingState}>
            <SubtitleDataContext.Provider value={activeSubtitles}>
              {children}
            </SubtitleDataContext.Provider>
          </SubtitleTimingContext.Provider>
        </SubtitleStateContext.Provider>
      </SubtitleHistoryContext.Provider>
    </SubtitleActionsContext.Provider>
  );
}

function ensureContext<T>(ctx: T | undefined, name: string): T {
  if (ctx === undefined) {
    throw new Error(`${name} must be used within a SubtitleProvider`);
  }
  return ctx;
}

export const useSubtitleState = (): SubtitleStateValue => {
  const ctx = useContext(SubtitleStateContext);
  return ensureContext(ctx, "useSubtitleState");
};

export const useSubtitleActionsContext = (): SubtitleActions => {
  const ctx = useContext(SubtitleActionsContext);
  return ensureContext(ctx, "useSubtitleActionsContext");
};

export const useSubtitleHistory = (): SubtitleHistoryValue => {
  const ctx = useContext(SubtitleHistoryContext);
  return ensureContext(ctx, "useSubtitleHistory");
};

export const useSubtitles = (): Subtitle[] => {
  const ctx = useContext(SubtitleDataContext);
  return ensureContext(ctx, "useSubtitles");
};

export const useSubtitleTimings = (): SubtitleTimingState => {
  const ctx = useContext(SubtitleTimingContext);
  return ensureContext(ctx, "useSubtitleTimings");
};

export const useSubtitleContext = (): SubtitleContextType => {
  const state = useSubtitleState();
  const actions = useSubtitleActionsContext();
  const history = useSubtitleHistory();
  const subtitles = useSubtitles();

  return useMemo(
    () => ({
      ...state,
      ...actions,
      ...history,
      subtitles,
    }),
    [actions, history, state, subtitles],
  );
};
