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
import {
  buildLocalSessionBackup,
  clearLocalSessionSnapshot,
  createLocalSessionSnapshot,
  getLocalSessionSignature,
  getLocalSessionBackupFilename,
  readLocalSessionSnapshot,
  shouldAutosaveLocalSession,
  writeLocalSessionSnapshot,
  type LocalSessionPreferences,
  type LocalSessionSnapshot,
} from "@/lib/local-session";
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
  showSubtitleDuration: boolean;
  setShowSubtitleDuration: (value: boolean) => void;
  addSpaceOnMerge: boolean;
  setAddSpaceOnMerge: (value: boolean) => void;
  clampOverlaps: boolean;
  setClampOverlaps: (value: boolean) => void;
  playInBackground: boolean;
  setPlayInBackground: (value: boolean) => void;
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

interface LocalSessionValue {
  pendingLocalSession: LocalSessionSnapshot | null;
  hasLocalSession: boolean;
  restoreLocalSession: () => void;
  discardLocalSession: () => void;
  clearLocalSession: () => void;
  downloadLocalSessionBackup: (snapshot?: LocalSessionSnapshot | null) => void;
}

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
const LocalSessionContext = createContext<LocalSessionValue | undefined>(
  undefined,
);

interface SubtitleProviderProps {
  children: ReactNode;
}

const readRecoverableLocalSession = (): LocalSessionSnapshot | null => {
  const snapshot = readLocalSessionSnapshot();
  return snapshot && shouldAutosaveLocalSession(snapshot) ? snapshot : null;
};

export function SubtitleProvider({ children }: SubtitleProviderProps) {
  const [tracks, setTracks] = useState<SubtitleTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [showTrackLabels, setShowTrackLabels] = useState<boolean>(false);
  const [showSubtitleDuration, setShowSubtitleDuration] =
    useState<boolean>(false);
  const [addSpaceOnMerge, setAddSpaceOnMerge] = useState<boolean>(false);
  const [clampOverlaps, setClampOverlaps] = useState<boolean>(true);
  const [playInBackground, setPlayInBackground] = useState<boolean>(false);
  const [pendingLocalSession, setPendingLocalSession] =
    useState<LocalSessionSnapshot | null>(() => readRecoverableLocalSession());
  const [hasLocalSession, setHasLocalSession] = useState(
    () => readRecoverableLocalSession() !== null,
  );
  const previousActiveTrackId = useRef<string | null>(null);
  const suppressedAutosaveSignatureRef = useRef<string | null>(null);
  const trackHistoriesRef = useRef<Map<string, UndoHistory<Subtitle[]>>>(
    new Map(),
  );

  const {
    present: activeSubtitles,
    setState: setSubtitlesWithHistory,
    undo: undoSubtitles,
    redo: redoSubtitles,
    canUndo: canUndoSubtitles,
    canRedo: canRedoSubtitles,
    getSnapshot: getHistorySnapshot,
    setSnapshot: setHistorySnapshot,
  } = useUndoableState<Subtitle[]>([], {
    isEqual: subtitlesAreEqual,
  });

  const localSessionPreferences = useMemo<LocalSessionPreferences>(
    () => ({
      showTrackLabels,
      showSubtitleDuration,
      addSpaceOnMerge,
      clampOverlaps,
      playInBackground,
    }),
    [
      showTrackLabels,
      showSubtitleDuration,
      addSpaceOnMerge,
      clampOverlaps,
      playInBackground,
    ],
  );

  const createCurrentLocalSession = useCallback(
    () =>
      createLocalSessionSnapshot({
        tracks,
        activeTrackId,
        preferences: localSessionPreferences,
      }),
    [activeTrackId, localSessionPreferences, tracks],
  );
  const currentLocalSessionSignature = useMemo(
    () =>
      getLocalSessionSignature({
        tracks,
        activeTrackId,
        preferences: localSessionPreferences,
      }),
    [activeTrackId, localSessionPreferences, tracks],
  );

  useEffect(() => {
    if (pendingLocalSession) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (
        suppressedAutosaveSignatureRef.current === currentLocalSessionSignature
      ) {
        return;
      }

      const snapshot = createCurrentLocalSession();
      if (shouldAutosaveLocalSession(snapshot)) {
        const didWrite = writeLocalSessionSnapshot(snapshot);
        if (didWrite) {
          suppressedAutosaveSignatureRef.current = null;
          setHasLocalSession(true);
        }
        return;
      }

      const didClear = clearLocalSessionSnapshot();
      if (didClear) {
        setHasLocalSession(false);
      }
    }, 750);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    createCurrentLocalSession,
    currentLocalSessionSignature,
    pendingLocalSession,
  ]);

  const restoreLocalSession = useCallback(() => {
    if (!pendingLocalSession) {
      return;
    }

    const nextHistories = new Map<string, UndoHistory<Subtitle[]>>();
    const nextTracks = pendingLocalSession.tracks.map((track) => {
      const history = createTrackHistory(track.id, track.subtitles);
      nextHistories.set(track.id, history);
      return {
        ...track,
        subtitles: history.present,
        vttPrologue: track.vttPrologue ? [...track.vttPrologue] : undefined,
      };
    });
    const nextActiveTrackId =
      pendingLocalSession.activeTrackId &&
      nextTracks.some((track) => track.id === pendingLocalSession.activeTrackId)
        ? pendingLocalSession.activeTrackId
        : (nextTracks[0]?.id ?? null);

    trackHistoriesRef.current = nextHistories;
    setTracks(nextTracks);
    setActiveTrackId(nextActiveTrackId);
    setShowTrackLabels(pendingLocalSession.preferences.showTrackLabels);
    setShowSubtitleDuration(
      pendingLocalSession.preferences.showSubtitleDuration,
    );
    setAddSpaceOnMerge(pendingLocalSession.preferences.addSpaceOnMerge);
    setClampOverlaps(pendingLocalSession.preferences.clampOverlaps);
    setPlayInBackground(pendingLocalSession.preferences.playInBackground);
    setHistorySnapshot(
      nextActiveTrackId
        ? (nextHistories.get(nextActiveTrackId) ?? EMPTY_HISTORY)
        : EMPTY_HISTORY,
    );
    suppressedAutosaveSignatureRef.current = null;
    setPendingLocalSession(null);
    setHasLocalSession(true);
  }, [pendingLocalSession, setHistorySnapshot]);

  const discardLocalSession = useCallback(() => {
    clearLocalSessionSnapshot();
    suppressedAutosaveSignatureRef.current = null;
    setPendingLocalSession(null);
    setHasLocalSession(false);
  }, []);

  const clearLocalSession = useCallback(() => {
    suppressedAutosaveSignatureRef.current = currentLocalSessionSignature;
    clearLocalSessionSnapshot();
    setPendingLocalSession(null);
    setHasLocalSession(false);
  }, [currentLocalSessionSignature]);

  const downloadLocalSessionBackup = useCallback(
    (snapshot?: LocalSessionSnapshot | null) => {
      const session =
        snapshot ?? pendingLocalSession ?? createCurrentLocalSession();
      if (!session || !shouldAutosaveLocalSession(session)) {
        return;
      }

      const blob = new Blob([buildLocalSessionBackup(session)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getLocalSessionBackupFilename(session);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [createCurrentLocalSession, pendingLocalSession],
  );

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
    addSpaceOnMerge,
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
      showSubtitleDuration,
      setShowSubtitleDuration,
      addSpaceOnMerge,
      setAddSpaceOnMerge,
      clampOverlaps,
      setClampOverlaps,
      playInBackground,
      setPlayInBackground,
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
      showSubtitleDuration,
      setShowSubtitleDuration,
      addSpaceOnMerge,
      setAddSpaceOnMerge,
      clampOverlaps,
      setClampOverlaps,
      playInBackground,
      setPlayInBackground,
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

  const localSessionValue = useMemo<LocalSessionValue>(
    () => ({
      pendingLocalSession,
      hasLocalSession,
      restoreLocalSession,
      discardLocalSession,
      clearLocalSession,
      downloadLocalSessionBackup,
    }),
    [
      pendingLocalSession,
      hasLocalSession,
      restoreLocalSession,
      discardLocalSession,
      clearLocalSession,
      downloadLocalSessionBackup,
    ],
  );

  return (
    <LocalSessionContext.Provider value={localSessionValue}>
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
    </LocalSessionContext.Provider>
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

export const useLocalSession = (): LocalSessionValue => {
  const ctx = useContext(LocalSessionContext);
  return ensureContext(ctx, "useLocalSession");
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
