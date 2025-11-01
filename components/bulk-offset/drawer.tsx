"use client";

import { BulkOffsetTable } from "@/components/bulk-offset/table";
import { getTrackHandleColor } from "@/lib/track-colors";
import { secondsToTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BulkOffsetControls, type BulkShiftTarget } from "./controls";

export interface BulkOffsetPreviewState {
  startSeconds: number;
  endSeconds: number;
  startChanged: boolean;
  endChanged: boolean;
}

interface BulkOffsetDrawerProps {
  isOpen: boolean;
  subtitles: Subtitle[];
  trackIndex: number;
  currentTrackName?: string | null;
  onPreviewChange?: (preview: Record<string, BulkOffsetPreviewState>) => void;
  onApplyOffset: (
    selectedUuids: string[],
    offsetSeconds: number,
    target: BulkShiftTarget,
  ) => void;
}

export function BulkOffsetDrawer({
  isOpen,
  subtitles,
  trackIndex,
  currentTrackName,
  onPreviewChange,
  onApplyOffset,
}: BulkOffsetDrawerProps) {
  const t = useTranslations();
  const [offsetSeconds, setOffsetSeconds] = useState(0);
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set());
  const [shiftTarget, setShiftTarget] = useState<BulkShiftTarget>("both");
  const lastInteractedIndexRef = useRef<number | null>(null);
  const normalizedTrackIndex = trackIndex >= 0 ? trackIndex : 0;
  const trackColor = getTrackHandleColor(normalizedTrackIndex);
  const trackNameLabel =
    currentTrackName && currentTrackName.trim().length > 0
      ? currentTrackName
      : t("waveform.untitledTrack");
  const lastPreviewRef = useRef<Record<string, BulkOffsetPreviewState>>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const available = new Set(subtitles.map((subtitle) => subtitle.uuid));
    setSelectedUuids((prev) => {
      if (prev.size === 0) {
        return available;
      }
      const filtered = new Set([...prev].filter((uuid) => available.has(uuid)));
      if (filtered.size === 0) {
        return available;
      }
      return filtered;
    });
  }, [isOpen, subtitles]);

  useEffect(() => {
    if (isOpen) {
      setOffsetSeconds(0);
      setShiftTarget("start");
    }
  }, [isOpen]);

  const subtitleCount = subtitles.length;
  const selectedCount = selectedUuids.size;
  const allSelected = subtitleCount > 0 && selectedCount === subtitleCount;
  const headerCheckboxState: CheckedState = allSelected
    ? true
    : selectedCount === 0
      ? false
      : "indeterminate";

  const selectionSummary =
    subtitleCount === 0
      ? t("bulkOffset.noCaptions")
      : t("bulkOffset.selectionSummary", {
          selected: selectedCount,
          total: subtitleCount,
        });

  const handleSelectAll = (checked: CheckedState) => {
    if (checked === true) {
      setSelectedUuids(new Set(subtitles.map((subtitle) => subtitle.uuid)));
      lastInteractedIndexRef.current = subtitles.length - 1;
      return;
    }
    setSelectedUuids(new Set());
    lastInteractedIndexRef.current = null;
  };

  const handleRowToggle = (
    index: number,
    uuid: string,
    shouldSelect: boolean,
    shiftKey: boolean,
  ) => {
    setSelectedUuids((prev) => {
      const next = new Set(prev);
      const applySelection = (targetIndex: number) => {
        const targetSubtitle = subtitles[targetIndex];
        if (!targetSubtitle) return;
        if (shouldSelect) {
          next.add(targetSubtitle.uuid);
        } else {
          next.delete(targetSubtitle.uuid);
        }
      };

      if (shiftKey && lastInteractedIndexRef.current !== null) {
        const start = Math.min(lastInteractedIndexRef.current, index);
        const end = Math.max(lastInteractedIndexRef.current, index);
        for (let i = start; i <= end; i += 1) {
          applySelection(i);
        }
      } else {
        applySelection(index);
      }

      lastInteractedIndexRef.current = index;
      return next;
    });
  };

  const handleApply = () => {
    if (selectedUuids.size === 0) {
      return;
    }
    onApplyOffset(Array.from(selectedUuids), offsetSeconds, shiftTarget);
    setOffsetSeconds(0);
  };

  const isApplyDisabled =
    selectedUuids.size === 0 || offsetSeconds === 0 || subtitleCount === 0;

  const previewSubtitles = subtitles.map((subtitle, index) => {
    const startSeconds = timeToSeconds(subtitle.startTime);
    const endSeconds = timeToSeconds(subtitle.endTime);
    const duration = Math.max(0, endSeconds - startSeconds);
    const previous = index > 0 ? subtitles[index - 1] : null;
    const next = index < subtitles.length - 1 ? subtitles[index + 1] : null;
    const previousEnd = previous ? timeToSeconds(previous.endTime) : 0;
    const nextStart = next ? timeToSeconds(next.startTime) : Infinity;

    const isTarget = selectedUuids.has(subtitle.uuid);
    const previousIsTarget =
      previous !== null ? selectedUuids.has(previous.uuid) : false;
    const nextIsTarget = next !== null ? selectedUuids.has(next.uuid) : false;

    if (!isTarget || offsetSeconds === 0) {
      return {
        previewStart: subtitle.startTime,
        previewEnd: subtitle.endTime,
        startChanged: false,
        endChanged: false,
      };
    }

    if (shiftTarget === "start") {
      const proposedStart = startSeconds + offsetSeconds;
      const lowerBound =
        offsetSeconds < 0 && !previousIsTarget
          ? previousEnd
          : startSeconds + offsetSeconds;
      const nextStartClamped =
        offsetSeconds > 0
          ? Math.min(proposedStart, endSeconds)
          : Math.max(proposedStart, Math.max(0, lowerBound));
      const clampedStart = Math.max(
        0,
        offsetSeconds < 0 && !previousIsTarget
          ? Math.max(proposedStart, previousEnd)
          : nextStartClamped,
      );
      const nextEnd =
        clampedStart > endSeconds ? clampedStart + duration : endSeconds;
      const previewStart = secondsToTime(clampedStart);
      const previewEnd = secondsToTime(Math.max(nextEnd, clampedStart));
      return {
        previewStart,
        previewEnd,
        startChanged: previewStart !== subtitle.startTime,
        endChanged: previewEnd !== subtitle.endTime,
      };
    }

    if (shiftTarget === "end") {
      const proposedEnd = endSeconds + offsetSeconds;
      const upperBound =
        offsetSeconds > 0 && !nextIsTarget
          ? Math.max(nextStart, startSeconds)
          : proposedEnd;
      const clampedEnd =
        offsetSeconds > 0 && !nextIsTarget
          ? Math.min(proposedEnd, upperBound)
          : Math.max(proposedEnd, startSeconds);
      const safeEnd =
        next === null && offsetSeconds > 0
          ? Math.max(clampedEnd, proposedEnd)
          : Math.max(clampedEnd, startSeconds);
      const previewEnd = secondsToTime(safeEnd);
      return {
        previewStart: subtitle.startTime,
        previewEnd,
        startChanged: false,
        endChanged: previewEnd !== subtitle.endTime,
      };
    }

    const lowerBound = Math.max(
      -startSeconds,
      previousIsTarget ? -startSeconds : previousEnd - startSeconds,
    );
    const upperBound =
      next !== null && !nextIsTarget
        ? nextStart - endSeconds
        : Number.POSITIVE_INFINITY;
    const clampedOffset = Math.min(
      Math.max(offsetSeconds, lowerBound),
      upperBound,
    );
    const previewStartSeconds = Math.max(0, startSeconds + clampedOffset);
    const previewEndSeconds = Math.max(
      previewStartSeconds,
      endSeconds + clampedOffset,
    );

    const previewStart = secondsToTime(previewStartSeconds);
    const previewEnd = secondsToTime(previewEndSeconds);
    return {
      previewStart,
      previewEnd,
      startChanged: previewStart !== subtitle.startTime,
      endChanged: previewEnd !== subtitle.endTime,
    };
  });

  useEffect(() => {
    if (!onPreviewChange) return;
    const shouldClear =
      !isOpen || offsetSeconds === 0 || selectedUuids.size === 0;
    if (shouldClear) {
      if (Object.keys(lastPreviewRef.current).length > 0) {
        lastPreviewRef.current = {};
        onPreviewChange({});
      }
      return;
    }

    const previewMap: Record<string, BulkOffsetPreviewState> = {};
    subtitles.forEach((subtitle, index) => {
      if (!selectedUuids.has(subtitle.uuid)) {
        return;
      }
      const preview = previewSubtitles[index];
      if (!preview) {
        return;
      }
      if (!preview.startChanged && !preview.endChanged) {
        return;
      }
      previewMap[subtitle.uuid] = {
        startSeconds: timeToSeconds(preview.previewStart),
        endSeconds: timeToSeconds(preview.previewEnd),
        startChanged: preview.startChanged,
        endChanged: preview.endChanged,
      };
    });

    const prev = lastPreviewRef.current;
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(previewMap);
    let changed = prevKeys.length !== nextKeys.length;
    if (!changed) {
      for (const key of nextKeys) {
        const next = previewMap[key];
        const prior = prev[key];
        if (
          !prior ||
          prior.startSeconds !== next.startSeconds ||
          prior.endSeconds !== next.endSeconds ||
          prior.startChanged !== next.startChanged ||
          prior.endChanged !== next.endChanged
        ) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      lastPreviewRef.current = previewMap;
      onPreviewChange(previewMap);
    }
  }, [
    isOpen,
    offsetSeconds,
    onPreviewChange,
    previewSubtitles,
    selectedUuids,
    subtitles,
  ]);

  useEffect(() => {
    return () => {
      lastPreviewRef.current = {};
      onPreviewChange?.({});
    };
  }, [onPreviewChange]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 flex h-full flex-1 flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col overflow-hidden">
        <h2 className="font-semibold text-lg mx-4 my-2">
          {t("bulkOffset.title", { track: trackNameLabel })}
        </h2>
        {subtitleCount === 0 ? (
          <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
            {t("bulkOffset.emptyState")}
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <BulkOffsetTable
              subtitles={subtitles}
              previewSubtitles={previewSubtitles}
              selectedUuids={selectedUuids}
              onToggleRow={handleRowToggle}
              onToggleAll={handleSelectAll}
              headerCheckboxState={headerCheckboxState}
              trackColor={trackColor}
            />
          </div>
        )}
      </div>

      <BulkOffsetControls
        offsetSeconds={offsetSeconds}
        onOffsetChange={setOffsetSeconds}
        onApply={handleApply}
        isApplyDisabled={isApplyDisabled}
        shiftTarget={shiftTarget}
        onShiftTargetChange={setShiftTarget}
        selectionSummary={selectionSummary}
        accentColor={trackColor}
      />
    </div>
  );
}
