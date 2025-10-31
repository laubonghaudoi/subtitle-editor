import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import type { UndoHistory } from "@/hooks/use-undoable-state";
import {
  addSubtitle,
  deleteSubtitle,
  mergeSubtitles,
  splitSubtitle,
  updateSubtitle,
  updateSubtitleEndTime,
  updateSubtitleStartTime,
} from "@/lib/subtitle-operations";
import { secondsToTime, timeToSeconds } from "@/lib/utils";
import {
  createTrackHistory,
  ensureTrackMetadata,
  EMPTY_HISTORY,
} from "@/lib/subtitle-history";

interface UseSubtitleActionsParams {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  setTracks: Dispatch<SetStateAction<SubtitleTrack[]>>;
  setActiveTrackId: (id: string | null) => void;
  trackHistoriesRef: MutableRefObject<Map<string, UndoHistory<Subtitle[]>>>;
  getHistorySnapshot: () => UndoHistory<Subtitle[]>;
  setHistorySnapshot: (history: UndoHistory<Subtitle[]>) => void;
  activeSubtitles: Subtitle[];
  setSubtitlesWithHistory: (
    action: Subtitle[] | ((prev: Subtitle[]) => Subtitle[]),
  ) => void;
}

interface SubtitleActions {
  addTrack: (
    name: string,
    subtitles?: Subtitle[],
    meta?: { vttHeader?: string; vttPrologue?: string[] },
  ) => string | null;
  loadSubtitlesIntoTrack: (
    trackId: string,
    newSubtitles: Subtitle[],
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
  replaceAllSubtitlesAction: (newSubtitles: Subtitle[]) => void;
  bulkShiftSubtitlesAction: (
    targetUuids: string[],
    offsetSeconds: number,
    target: "start" | "end" | "both",
  ) => void;
}

const TRACK_LIMIT = 4;

export const useSubtitleActions = ({
  tracks,
  activeTrackId,
  setTracks,
  setActiveTrackId,
  trackHistoriesRef,
  getHistorySnapshot,
  setHistorySnapshot,
  activeSubtitles,
  setSubtitlesWithHistory,
}: UseSubtitleActionsParams): SubtitleActions =>
  useMemo(() => {
    const handleTrackedStateChange = (newSubtitles: Subtitle[]) => {
      if (!activeTrackId) {
        setSubtitlesWithHistory(newSubtitles);
        return;
      }

      const normalized = ensureTrackMetadata(newSubtitles, activeTrackId);
      setSubtitlesWithHistory(normalized);
      setTracks((prevTracks) =>
        prevTracks.map((track) =>
          track.id === activeTrackId
            ? { ...track, subtitles: normalized }
            : track,
        ),
      );
    };

    const addTrack = (
      name: string,
      subtitles: Subtitle[] = [],
      meta?: { vttHeader?: string; vttPrologue?: string[] },
    ): string | null => {
      if (tracks.length >= TRACK_LIMIT) {
        console.warn("Maximum number of tracks (4) reached.");
        return null;
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
      setTracks((prev) => [...prev, newTrack]);
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
      meta?: { vttHeader?: string; vttPrologue?: string[] },
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
        }),
      );
      if (trackId === activeTrackId) {
        setHistorySnapshot(history);
      }
    };

    const deleteTrack = (trackId: string) => {
      trackHistoriesRef.current.delete(trackId);
      setTracks((prevTracks) => {
        const remainingTracks = prevTracks.filter(
          (track) => track.id !== trackId,
        );
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
      setTracks((prevTracks) =>
        prevTracks.map((track) =>
          track.id === trackId ? { ...track, name: newName } : track,
        ),
      );
    };

    const setInitialSubtitles = (
      subs: Subtitle[],
      trackName?: string,
      meta?: { vttHeader?: string; vttPrologue?: string[] },
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

    const addSubtitleAction = (
      beforeId: number,
      afterId: number | null,
      newSubtitleText?: string,
    ) => {
      handleTrackedStateChange(
        addSubtitle(activeSubtitles, beforeId, afterId, newSubtitleText),
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
      textLength: number,
      pendingText?: string,
    ) => {
      const workingSubtitles =
        pendingText === undefined
          ? activeSubtitles
          : activeSubtitles.map((sub) =>
              sub.id === id ? { ...sub, text: pendingText } : sub,
            );
      const effectiveLength =
        pendingText === undefined ? textLength : pendingText.length;
      handleTrackedStateChange(
        splitSubtitle(workingSubtitles, id, caretPos, effectiveLength),
      );
    };

    const updateSubtitleTextAction = (id: number, newText: string) => {
      handleTrackedStateChange(updateSubtitle(activeSubtitles, id, newText));
    };

    const updateSubtitleTimeAction = (
      id: number,
      newStartTime: string,
      newEndTime: string,
    ) => {
      handleTrackedStateChange(
        activeSubtitles.map((sub) =>
          sub.id === id
            ? { ...sub, startTime: newStartTime, endTime: newEndTime }
            : sub,
        ),
      );
    };

    const updateSubtitleTimeByUuidAction = (
      uuid: string,
      newStartTime: string,
      newEndTime: string,
    ) => {
      let updatedActiveTrackSubtitles: Subtitle[] | null = null;

      setTracks((prevTracks) =>
        prevTracks.map((track) => {
          let hasChanges = false;
          const subtitles = track.subtitles.map((sub) => {
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
        }),
      );

      if (updatedActiveTrackSubtitles) {
        setSubtitlesWithHistory(updatedActiveTrackSubtitles);
      }
    };

    const updateSubtitleStartTimeAction = (id: number, newTime: string) => {
      handleTrackedStateChange(
        updateSubtitleStartTime(id, newTime)(activeSubtitles),
      );
    };

    const updateSubtitleEndTimeAction = (id: number, newTime: string) => {
      handleTrackedStateChange(
        updateSubtitleEndTime(id, newTime)(activeSubtitles),
      );
    };

    const replaceAllSubtitlesAction = (newSubtitles: Subtitle[]) => {
      handleTrackedStateChange(newSubtitles);
    };

    const bulkShiftSubtitlesAction = (
      targetUuids: string[],
      offsetSeconds: number,
      target: "start" | "end" | "both",
    ) => {
      if (!activeSubtitles.length) {
        return;
      }
      if (offsetSeconds === 0) {
        return;
      }
      const targetSet = new Set(targetUuids);
      if (targetSet.size === 0) {
        return;
      }

      const updated = activeSubtitles.map((subtitle, index) => {
        if (!targetSet.has(subtitle.uuid)) {
          return subtitle;
        }

        const startSeconds = timeToSeconds(subtitle.startTime);
        const endSeconds = timeToSeconds(subtitle.endTime);
        const duration = Math.max(0, endSeconds - startSeconds);
        const previousSubtitle = index > 0 ? activeSubtitles[index - 1] : null;
        const nextSubtitle =
          index < activeSubtitles.length - 1
            ? activeSubtitles[index + 1]
            : null;
        const previousEndSeconds = previousSubtitle
          ? timeToSeconds(previousSubtitle.endTime)
          : 0;
        const nextStartSeconds = nextSubtitle
          ? timeToSeconds(nextSubtitle.startTime)
          : Number.POSITIVE_INFINITY;
        const previousIsTarget = previousSubtitle
          ? targetSet.has(previousSubtitle.uuid)
          : false;
        const nextIsTarget = nextSubtitle
          ? targetSet.has(nextSubtitle.uuid)
          : false;

        let nextStart = startSeconds;
        let nextEnd = endSeconds;

        if (target === "start") {
          const proposedStart = startSeconds + offsetSeconds;
          if (offsetSeconds < 0) {
            const lowerBound = previousIsTarget
              ? 0
              : Math.max(0, previousEndSeconds);
            nextStart = Math.max(proposedStart, lowerBound);
          } else {
            nextStart = Math.min(proposedStart, endSeconds);
          }
          nextStart = Math.max(0, nextStart);
          if (nextStart > nextEnd) {
            nextEnd = nextStart + duration;
          }
        } else if (target === "end") {
          const proposedEnd = endSeconds + offsetSeconds;
          if (offsetSeconds < 0) {
            nextEnd = Math.max(proposedEnd, nextStart);
          } else {
            const upperBound = nextIsTarget || !Number.isFinite(nextStartSeconds)
              ? proposedEnd
              : Math.max(nextStartSeconds, nextStart);
            nextEnd = Math.min(proposedEnd, upperBound);
          }
          nextEnd = Math.max(nextStart, nextEnd);
          if (nextSubtitle === null && offsetSeconds > 0) {
            nextEnd = Math.max(nextEnd, proposedEnd);
          }
          if (nextEnd < nextStart) {
            nextEnd = nextStart;
          }
        } else if (target === "both") {
          const minOffset = Math.max(
            previousIsTarget ? -startSeconds : previousEndSeconds - startSeconds,
            -startSeconds,
          );
          const maxOffset = nextSubtitle && !nextIsTarget
            ? nextStartSeconds - endSeconds
            : Number.POSITIVE_INFINITY;
          const clampedOffset = Math.min(
            Math.max(offsetSeconds, minOffset),
            maxOffset,
          );

          nextStart = Math.max(0, startSeconds + clampedOffset);
          nextEnd = Math.max(nextStart, endSeconds + clampedOffset);
        }

        return {
          ...subtitle,
          startTime: secondsToTime(nextStart),
          endTime: secondsToTime(nextEnd),
        };
      });

      handleTrackedStateChange(updated);
    };

    return {
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
      bulkShiftSubtitlesAction,
    };
  }, [
    activeSubtitles,
    activeTrackId,
    getHistorySnapshot,
    setActiveTrackId,
    setHistorySnapshot,
    setSubtitlesWithHistory,
    setTracks,
    trackHistoriesRef,
    tracks,
  ]);
