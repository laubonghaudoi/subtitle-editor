import type { BulkOffsetPreviewState } from "@/components/bulk-offset/drawer";
import { getTrackColor, getTrackHandleColor } from "@/lib/track-colors";
import { secondsToTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import type WaveSurfer from "wavesurfer.js";
import RegionsPlugin, {
  type Region,
} from "wavesurfer.js/dist/plugins/regions.esm.js";
import {
  useLabelMeasurements,
  type RegionMapEntry,
} from "./use-label-measurements";
import { usePreviewRegions } from "./use-preview-regions";
import { applyRegionHandleStyles, createSubtitleRegionContent } from "./utils";

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
}: UseWaveformRegionsParams) => {
  const subtitleToRegionMap = useRef<Map<string, RegionMapEntry>>(new Map());
  // Track drag state to avoid repeated scroll triggers mid-drag
  // Dragging regions should not trigger auto scroll/tab switching
  const lastDraggedSubtitleId = useRef<string | null>(null);
  const prevTrackCountRef = useRef<number>(tracks.length);
  const prevTracksRef = useRef<SubtitleTrack[]>(tracks);

  const { labelsOffsetTop, labelsAreaHeight, measureLabelsOverlay } =
    useLabelMeasurements(containerRef, tracks, subtitleToRegionMap);
  const {
    previewOffsetsRef,
    updatePreviewRegions,
    clearPreviewRegions,
  } = usePreviewRegions(wavesurfer, subtitleToRegionMap);

  /**
   * Recreates all regions from scratch. Used when structural changes happen
   * (track added/removed or subtitle order changed).
   */
  const regenerateRegions = useCallback(() => {
    if (!wavesurfer || wavesurfer.getDuration() === 0) return;

    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((plugin) => plugin instanceof RegionsPlugin) as
      | RegionsPlugin
      | undefined;
    if (!regionsPlugin) return;

    regionsPlugin.getRegions().forEach((region) => {
      region.remove();
    });
    regionsPlugin.clearRegions();
    subtitleToRegionMap.current.clear();
    clearPreviewRegions();

    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        const start = timeToSeconds(subtitle.startTime);
        const end = timeToSeconds(subtitle.endTime);

        const content = createSubtitleRegionContent(
          subtitle.startTime,
          subtitle.text,
          subtitle.endTime,
          { theme },
        );

        const regionColor = getTrackColor(trackIndex);
        const handleColor = getTrackHandleColor(trackIndex);

        const region = regionsPlugin.addRegion({
          id: subtitle.uuid,
          start,
          end,
          content,
          color: regionColor,
          drag: true,
          resize: true,
          minLength: 0.1,
        });

        if (region.element) {
          const trackHeight = 100 / tracks.length;
          const trackTop = trackIndex * trackHeight;
          region.element.style.top = `${trackTop}%`;
          region.element.style.height = `${trackHeight}%`;
          region.element.style.position = "absolute";
        }

        applyRegionHandleStyles(region, handleColor);

        subtitleToRegionMap.current.set(subtitle.uuid, {
          region,
          trackId: track.id,
          trackIndex,
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
    // When tracks/subtitles change, decide if we can update in place
    // or if a full regeneration is required.
    if (!wavesurfer) return;

    const prevTracks = prevTracksRef.current;
    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((plugin) => plugin instanceof RegionsPlugin) as
      | RegionsPlugin
      | undefined;
    if (!regionsPlugin) return;

    let shouldRecreate = false;
    if (prevTracks.length !== tracks.length) {
      shouldRecreate = true;
    }
    if (!shouldRecreate) {
      for (let i = 0; i < tracks.length; i += 1) {
        const prevTrack = prevTracks[i];
        const nextTrack = tracks[i];
        if (!prevTrack || prevTrack.id !== nextTrack.id) {
          shouldRecreate = true;
          break;
        }
        if (prevTrack.subtitles.length !== nextTrack.subtitles.length) {
          shouldRecreate = true;
          break;
        }
        for (let j = 0; j < nextTrack.subtitles.length; j += 1) {
          if (prevTrack.subtitles[j]?.uuid !== nextTrack.subtitles[j]?.uuid) {
            shouldRecreate = true;
            break;
          }
        }
        if (shouldRecreate) break;
      }
    }

    if (shouldRecreate) {
      regenerateRegions();
      prevTrackCountRef.current = tracks.length;
      prevTracksRef.current = tracks;
      return;
    }

    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        const entry = subtitleToRegionMap.current.get(subtitle.uuid);
        if (!entry) return;
        const nextStart = timeToSeconds(subtitle.startTime);
        const nextEnd = timeToSeconds(subtitle.endTime);
        entry.region.setOptions({ start: nextStart, end: nextEnd });
        entry.region.setOptions({
          content: createSubtitleRegionContent(
            subtitle.startTime,
            subtitle.text,
            subtitle.endTime,
            { theme },
          ),
        });
        applyRegionHandleStyles(entry.region, getTrackHandleColor(trackIndex));
      });
    });

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
      let adjusted = false;

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
       * 2. If the region is dragged to partially overlap with other regions,
       *  it will be adjusted to avoid overlapping.
       */

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

      if (
        (prevRegion && newEndTime <= prevRegion.start) ||
        (nextRegion && newStartTime >= nextRegion.end)
      ) {
        const originalSubtitle = currentTrack.subtitles.find(
          (subtitle) => subtitle.uuid === subtitleUuid,
        );
        if (originalSubtitle) {
          const originalStartTime = timeToSeconds(originalSubtitle.startTime);
          const originalEndTime = timeToSeconds(originalSubtitle.endTime);

          region.setOptions({
            start: originalStartTime,
            end: originalEndTime,
          });
          region.setOptions({
            content: createSubtitleRegionContent(
              originalSubtitle.startTime,
              originalSubtitle.text,
              originalSubtitle.endTime,
              { theme },
            ),
          });

          const trackIndex = tracks.findIndex(
            (track) => track.id === currentTrack?.id,
          );
          const handleColor = getTrackHandleColor(trackIndex);
          applyRegionHandleStyles(region, handleColor);
        }
        return;
      }

      if (prevRegion && newStartTime < prevRegion.end) {
        adjusted = true;
        newStartTime = prevRegion.end;
        if (newStartTime >= newEndTime) {
          newEndTime = newStartTime + 0.1;
        }
      }
      if (nextRegion && newEndTime > nextRegion.start) {
        adjusted = true;
        newEndTime = nextRegion.start;
        if (newEndTime <= newStartTime) {
          newStartTime = newEndTime - 0.1;
        }
      }

      if (adjusted) {
        region.setOptions({
          start: newStartTime,
          end: newEndTime,
        });
      }

      const newStartTimeFormatted = secondsToTime(newStartTime);
      const newEndTimeFormatted = secondsToTime(newEndTime);

      const subtitle = currentTrack.subtitles.find(
        (item) => item.uuid === subtitleUuid,
      );
      if (subtitle) {
        region.setOptions({
          content: createSubtitleRegionContent(
            newStartTimeFormatted,
            subtitle.text,
            newEndTimeFormatted,
            { theme },
          ),
        });

        const trackIndex = tracks.findIndex(
          (track) => track.id === currentTrack?.id,
        );
        const handleColor = getTrackHandleColor(trackIndex);
        applyRegionHandleStyles(region, handleColor);
      }

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

    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((plugin) => plugin instanceof RegionsPlugin) as
      | RegionsPlugin
      | undefined;
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

  // Update subtitle text requires only updating the target region content
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

    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((plugin) => plugin instanceof RegionsPlugin) as
      | RegionsPlugin
      | undefined;
    if (!regionsPlugin) return;

    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        if (subtitle.uuid === lastDraggedSubtitleId.current) {
          return;
        }

        const regionData = subtitleToRegionMap.current.get(subtitle.uuid);

        if (!regionData) {
          const start = timeToSeconds(subtitle.startTime);
          const end = timeToSeconds(subtitle.endTime);
          const content = createSubtitleRegionContent(
            subtitle.startTime,
            subtitle.text,
            subtitle.endTime,
            { theme },
          );

          const regionColor = getTrackColor(trackIndex);
          const handleColor = getTrackHandleColor(trackIndex);

          const region = regionsPlugin.addRegion({
            id: subtitle.uuid,
            start,
            end,
            content,
            color: regionColor,
            drag: true,
            resize: true,
            minLength: 0.1,
          });

          if (region.element) {
            const trackHeight = 100 / tracks.length;
            const trackTop = trackIndex * trackHeight;
            region.element.style.top = `${trackTop}%`;
            region.element.style.height = `${trackHeight}%`;
            region.element.style.position = "absolute";
          }

          applyRegionHandleStyles(region, handleColor);
          subtitleToRegionMap.current.set(subtitle.uuid, {
            region,
            trackId: track.id,
            trackIndex,
          });
        } else if (regionData.region.element) {
          const region = regionData.region;
          const newStart = timeToSeconds(subtitle.startTime);
          const newEnd = timeToSeconds(subtitle.endTime);

          if (region.start !== newStart || region.end !== newEnd) {
            region.setOptions({
              start: newStart,
              end: newEnd,
            });
          }

          region.setOptions({
            content: createSubtitleRegionContent(
              subtitle.startTime,
              subtitle.text,
              subtitle.endTime,
              { theme },
            ),
          });

          const handleColor = getTrackHandleColor(trackIndex);
          applyRegionHandleStyles(region, handleColor);

          const element = region.element as HTMLElement | null;
          if (element) {
            const trackHeight = 100 / tracks.length;
            const trackTop = trackIndex * trackHeight;
            element.style.top = `${trackTop}%`;
            element.style.height = `${trackHeight}%`;
            element.style.position = "absolute";
          }

          subtitleToRegionMap.current.set(subtitle.uuid, {
            region,
            trackId: track.id,
            trackIndex,
          });
        }
      });
    });

    const allSubtitleUuids = new Set<string>();
    tracks.forEach((track) => {
      track.subtitles.forEach((subtitle) => {
        allSubtitleUuids.add(subtitle.uuid);
      });
    });

    for (const [uuid, regionData] of subtitleToRegionMap.current.entries()) {
      if (!allSubtitleUuids.has(uuid)) {
        regionData.region.remove();
        subtitleToRegionMap.current.delete(uuid);
      }
    }

    requestAnimationFrame(measureLabelsOverlay);
  }, [tracks, wavesurfer, measureLabelsOverlay, theme]);

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
