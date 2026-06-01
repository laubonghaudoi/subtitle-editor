import type { BulkOffsetPreviewState } from "@/components/bulk-offset/drawer";
import { shouldIgnorePauseWhileHidden } from "@/hooks/use-visibility-playback";
import { secondsToTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import type WaveSurfer from "wavesurfer.js";
import type { Region } from "wavesurfer.js/dist/plugins/regions.esm.js";
import {
  useLabelMeasurements,
  type RegionMapEntry,
} from "./use-label-measurements";
import { usePreviewRegions } from "./use-preview-regions";
import {
  createRegionForSubtitle,
  getRegionsPlugin,
  hasStructuralRegionChange,
  pruneStaleRegions,
  renderRegionContent,
  syncRegionForSubtitle,
} from "./utils";

interface UseWaveformRegionsParams {
  wavesurfer: WaveSurfer | null;
  containerRef: RefObject<HTMLDivElement | null>;
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  setActiveTrackId: (trackId: string | null) => void;
  onRegionClick?: (uuid: string, opts?: { crossTrack?: boolean }) => void;
  onPlayPause: (playing: boolean) => void;
  updateSubtitleTimeByUuidAction: (
    uuid: string,
    start: string,
    end: string,
  ) => void;
  previewOffsets: Record<string, BulkOffsetPreviewState>;
  setIsLoading: (loading: boolean) => void;
  showTrackLabels: boolean;
  theme: "light" | "dark";
  clampOverlaps: boolean;
  playInBackground: boolean;
}

export const useWaveformRegions = ({
  wavesurfer,
  containerRef,
  tracks,
  activeTrackId,
  setActiveTrackId,
  onRegionClick,
  onPlayPause,
  updateSubtitleTimeByUuidAction,
  previewOffsets,
  setIsLoading,
  showTrackLabels,
  theme,
  clampOverlaps,
  playInBackground,
}: UseWaveformRegionsParams) => {
  const subtitleToRegionMap = useRef<Map<string, RegionMapEntry>>(new Map());
  // Track drag state to avoid repeated scroll triggers mid-drag
  // Dragging regions should not trigger auto scroll/tab switching
  const lastDraggedSubtitleId = useRef<string | null>(null);
  const prevTracksRef = useRef<SubtitleTrack[]>(tracks);

  const { labelsOffsetTop, labelsAreaHeight, measureLabelsOverlay } =
    useLabelMeasurements(containerRef, tracks, subtitleToRegionMap);
  const { previewOffsetsRef, updatePreviewRegions, clearPreviewRegions } =
    usePreviewRegions(wavesurfer, subtitleToRegionMap);

  /**
   * Recreates all regions from scratch. Used when structural changes happen
   * (track added/removed or subtitle order changed).
   */
  const regenerateRegions = useCallback(() => {
    if (!wavesurfer || wavesurfer.getDuration() === 0) return;

    const regionsPlugin = getRegionsPlugin(wavesurfer);
    if (!regionsPlugin) return;

    regionsPlugin.getRegions().forEach((region) => {
      region.remove();
    });
    regionsPlugin.clearRegions();
    subtitleToRegionMap.current.clear();
    clearPreviewRegions();

    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        createRegionForSubtitle({
          regionsPlugin,
          subtitle,
          trackId: track.id,
          trackIndex,
          trackCount: tracks.length,
          theme,
          subtitleToRegionMap: subtitleToRegionMap.current,
        });
      });
    });

    requestAnimationFrame(measureLabelsOverlay);
    updatePreviewRegions(previewOffsetsRef.current);
  }, [
    tracks,
    wavesurfer,
    measureLabelsOverlay,
    updatePreviewRegions,
    theme,
    previewOffsetsRef,
    clearPreviewRegions,
  ]);

  useEffect(() => {
    if (!wavesurfer) return;
    const duration = (() => {
      try {
        return wavesurfer.getDuration();
      } catch {
        return 0;
      }
    })();
    if (!duration) return;

    const prevTracks = prevTracksRef.current;
    const regionsPlugin = getRegionsPlugin(wavesurfer);
    if (!regionsPlugin) return;

    if (hasStructuralRegionChange(prevTracks, tracks)) {
      regenerateRegions();
      prevTracksRef.current = tracks;
      return;
    }

    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        if (subtitle.uuid === lastDraggedSubtitleId.current) {
          return;
        }

        syncRegionForSubtitle({
          regionsPlugin,
          subtitleToRegionMap: subtitleToRegionMap.current,
          subtitle,
          trackId: track.id,
          trackIndex,
          trackCount: tracks.length,
          theme,
        });
      });
    });

    pruneStaleRegions(tracks, subtitleToRegionMap.current);
    requestAnimationFrame(measureLabelsOverlay);
    prevTracksRef.current = tracks;
  }, [tracks, wavesurfer, regenerateRegions, measureLabelsOverlay, theme]);

  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setIsLoading(false);
      regenerateRegions();
      wavesurfer.setMuted(true);
      requestAnimationFrame(measureLabelsOverlay);
    };

    const handlePlay = () => {
      wavesurfer.setMuted(true);
      onPlayPause(true);
    };

    const handlePause = () => {
      if (shouldIgnorePauseWhileHidden(playInBackground)) {
        return;
      }
      onPlayPause(false);
    };

    // Called whenever a region is dragged/resized
    const handleRegionUpdate = (region: Region) => {
      const subtitleUuid = region.id;
      if (subtitleUuid.startsWith("preview-")) {
        return;
      }
      let newStartTime = region.start;
      let newEndTime = region.end;

      let currentSubtitle: Subtitle | undefined;
      let currentTrack: SubtitleTrack | undefined;

      for (const track of tracks) {
        currentSubtitle = track.subtitles.find((s) => s.uuid === subtitleUuid);
        if (currentSubtitle) {
          currentTrack = track;
          break;
        }
      }

      if (!currentSubtitle || !currentTrack) return;

      /** The following codes checks the drag-and-drop behavior of regions
       * 1. If the region is dragged to pass over the preceding or following
       *  region completely, i.e. the start time is later than the end time
       *  of the following region, or the end time is earlier than the start
       *  time of the preceding region), it will be reverted to its original
       *  position.
       * 2. If overlap clamping is enabled and the region partially overlaps
       *  with other regions, it will be adjusted to avoid overlapping.
       */

      const orderedIndex = currentTrack.subtitles.findIndex(
        (subtitle) => subtitle.uuid === subtitleUuid,
      );
      const hasOrderIndex = orderedIndex >= 0;
      const prevOrderedSubtitle =
        hasOrderIndex && orderedIndex > 0
          ? currentTrack.subtitles[orderedIndex - 1]
          : null;
      const nextOrderedSubtitle =
        hasOrderIndex && orderedIndex < currentTrack.subtitles.length - 1
          ? currentTrack.subtitles[orderedIndex + 1]
          : null;
      const prevOrderedRegion = prevOrderedSubtitle
        ? (subtitleToRegionMap.current.get(prevOrderedSubtitle.uuid)?.region ??
          null)
        : null;
      const nextOrderedRegion = nextOrderedSubtitle
        ? (subtitleToRegionMap.current.get(nextOrderedSubtitle.uuid)?.region ??
          null)
        : null;

      if (
        (prevOrderedRegion && newEndTime <= prevOrderedRegion.start) ||
        (nextOrderedRegion && newStartTime >= nextOrderedRegion.end)
      ) {
        const originalSubtitle = currentTrack.subtitles.find(
          (subtitle) => subtitle.uuid === subtitleUuid,
        );
        if (originalSubtitle) {
          const originalStartTime = timeToSeconds(originalSubtitle.startTime);
          const originalEndTime = timeToSeconds(originalSubtitle.endTime);
          const trackIndex = tracks.findIndex(
            (track) => track.id === currentTrack?.id,
          );
          renderRegionContent({
            region,
            subtitle: originalSubtitle,
            trackIndex,
            theme,
            timing: {
              start: originalStartTime,
              end: originalEndTime,
            },
          });
        }
        return;
      }

      const trackRegions = Array.from(subtitleToRegionMap.current.values())
        .filter((regionData) => regionData.trackId === currentTrack?.id)
        .map((regionData) => regionData.region)
        .sort((a, b) => a.start - b.start);

      const currentIndex = trackRegions.findIndex((r) => r.id === subtitleUuid);

      const prevRegion =
        currentIndex > 0 ? trackRegions[currentIndex - 1] : null;
      const nextRegion =
        currentIndex < trackRegions.length - 1
          ? trackRegions[currentIndex + 1]
          : null;

      if (clampOverlaps) {
        if (prevRegion && newStartTime < prevRegion.end) {
          newStartTime = prevRegion.end;
          if (newStartTime >= newEndTime) {
            newEndTime = newStartTime + 0.1;
          }
        }
        if (nextRegion && newEndTime > nextRegion.start) {
          newEndTime = nextRegion.start;
          if (newEndTime <= newStartTime) {
            newStartTime = newEndTime - 0.1;
          }
        }
      }

      const newStartTimeFormatted = secondsToTime(newStartTime);
      const newEndTimeFormatted = secondsToTime(newEndTime);
      const trackIndex = tracks.findIndex(
        (track) => track.id === currentTrack?.id,
      );
      renderRegionContent({
        region,
        subtitle: {
          ...currentSubtitle,
          startTime: newStartTimeFormatted,
          endTime: newEndTimeFormatted,
        },
        trackIndex,
        theme,
        timing: {
          start: newStartTime,
          end: newEndTime,
        },
      });

      // Mark this subtitle as being dragged to avoid re-rendering it
      lastDraggedSubtitleId.current = subtitleUuid;

      // Do not auto switch tabs or scroll during drag; only update times
      // Call context action with the UUID to update the correct subtitle in the correct track
      updateSubtitleTimeByUuidAction(
        subtitleUuid,
        newStartTimeFormatted,
        newEndTimeFormatted,
      );
      requestAnimationFrame(measureLabelsOverlay);
    };

    // Handle region clicks to switch active track and focus subtitle
    const handleRegionClick = (region: Region) => {
      if (region.id.startsWith("preview-")) {
        return;
      }
      const regionData = subtitleToRegionMap.current.get(region.id);
      if (regionData) {
        if (regionData.trackId !== activeTrackId) {
          setActiveTrackId(regionData.trackId);
          if (onRegionClick) {
            setTimeout(() => {
              onRegionClick(region.id, { crossTrack: true });
            }, 150);
          }
        } else if (onRegionClick) {
          onRegionClick(region.id, { crossTrack: false });
        }
      }
    };

    wavesurfer.on("ready", handleReady);
    wavesurfer.on("play", handlePlay);
    wavesurfer.on("pause", handlePause);

    const regionsPlugin = getRegionsPlugin(wavesurfer);
    if (regionsPlugin) {
      regionsPlugin.on("region-updated", handleRegionUpdate);
      regionsPlugin.on("region-clicked", handleRegionClick);
    }

    // Clear the drag-skip flag when pointer is released
    const handlePointerUp = () => {
      lastDraggedSubtitleId.current = null;
    };
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      wavesurfer.un("ready", handleReady);
      wavesurfer.un("play", handlePlay);
      wavesurfer.un("pause", handlePause);
      if (regionsPlugin) {
        regionsPlugin.un("region-updated", handleRegionUpdate);
        regionsPlugin.un("region-clicked", handleRegionClick);
      }
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    wavesurfer,
    onPlayPause,
    updateSubtitleTimeByUuidAction,
    measureLabelsOverlay,
    regenerateRegions,
    tracks,
    activeTrackId,
    setActiveTrackId,
    onRegionClick,
    setIsLoading,
    theme,
    clampOverlaps,
    playInBackground,
  ]);

  useEffect(() => {
    previewOffsetsRef.current = previewOffsets ?? {};
    updatePreviewRegions(previewOffsets ?? {});
  }, [previewOffsets, updatePreviewRegions, previewOffsetsRef]);

  useEffect(() => {
    return () => {
      clearPreviewRegions();
    };
  }, [clearPreviewRegions]);

  // Re-measure on window resize
  useEffect(() => {
    const onResize = () => requestAnimationFrame(measureLabelsOverlay);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureLabelsOverlay]);

  // Re-measure label overlay when labels are toggled or track count changes
  useEffect(() => {
    requestAnimationFrame(measureLabelsOverlay);
  }, [showTrackLabels, tracks.length, measureLabelsOverlay]);

  return {
    subtitleToRegionMap,
    labelsOffsetTop,
    labelsAreaHeight,
  };
};
