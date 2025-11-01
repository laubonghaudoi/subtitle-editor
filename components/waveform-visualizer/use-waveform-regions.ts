import type { BulkOffsetPreviewState } from "@/components/bulk-offset/drawer";
import {
  TRACK_COLORS,
  createContrastColor,
  getTrackHandleColor,
  hexToRgba,
} from "@/lib/track-colors";
import { secondsToTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type WaveSurfer from "wavesurfer.js";
import RegionsPlugin, {
  type Region,
} from "wavesurfer.js/dist/plugins/regions.esm.js";
import { applyRegionHandleStyles, createSubtitleRegionContent } from "./utils";

type RegionMapEntry = {
  region: Region;
  trackId: string;
  trackIndex: number;
};

interface UseWaveformRegionsParams {
  wavesurfer: WaveSurfer | null;
  containerRef: RefObject<HTMLDivElement>;
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
}: UseWaveformRegionsParams) => {
  const subtitleToRegionMap = useRef<Map<string, RegionMapEntry>>(new Map());
  const previewRegionMap = useRef<Map<string, Region>>(new Map());
  const previewOffsetsRef = useRef<Record<string, BulkOffsetPreviewState>>({});
  // Track drag state to avoid repeated scroll triggers mid-drag
  // Dragging regions should not trigger auto scroll/tab switching
  const lastDraggedSubtitleId = useRef<string | null>(null);
  const prevTrackCountRef = useRef<number>(tracks.length);

  const [labelsOffsetTop, setLabelsOffsetTop] = useState(0);
  const [labelsAreaHeight, setLabelsAreaHeight] = useState(0);

  const measureLabelsOverlay = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setLabelsOffsetTop(0);
      setLabelsAreaHeight(0);
      return;
    }
    const containerRect = container.getBoundingClientRect();

    let laneHeight = 0;
    let topOfFirstLanePx: number | null = null;

    subtitleToRegionMap.current.forEach(({ region, trackId }) => {
      if (!region.element) return;
      const el = region.element as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        laneHeight = rect.height;
        const idx = tracks.findIndex((t) => t.id === trackId);
        const laneTopForThis = rect.top - containerRect.top;
        const top0 = laneTopForThis - idx * laneHeight;
        topOfFirstLanePx =
          topOfFirstLanePx === null ? top0 : Math.min(topOfFirstLanePx, top0);
      }
    });

    if (!laneHeight || topOfFirstLanePx === null) {
      setLabelsOffsetTop(0);
      setLabelsAreaHeight(0);
      return;
    }

    setLabelsOffsetTop(Math.max(0, topOfFirstLanePx));
    setLabelsAreaHeight(Math.max(0, laneHeight * Math.max(1, tracks.length)));
  }, [containerRef, tracks]);

  const updatePreviewRegions = useCallback(
    (previewMap: Record<string, BulkOffsetPreviewState>) => {
      if (!wavesurfer) return;
      let duration = 0;
      try {
        duration = wavesurfer.getDuration();
      } catch {
        duration = 0;
      }
      if (!duration) return;

      const regionsPlugin = wavesurfer
        .getActivePlugins()
        .find((plugin) => plugin instanceof RegionsPlugin) as
        | RegionsPlugin
        | undefined;
      if (!regionsPlugin) return;

      previewRegionMap.current.forEach((overlay, uuid) => {
        const entry = previewMap[uuid];
        if (!entry || (!entry.startChanged && !entry.endChanged)) {
          overlay.remove();
          previewRegionMap.current.delete(uuid);
        }
      });

      Object.entries(previewMap).forEach(([uuid, data]) => {
        const hasDiff = data.startChanged || data.endChanged;
        const baseRegionEntry = subtitleToRegionMap.current.get(uuid);
        if (!hasDiff || !baseRegionEntry) {
          const existing = previewRegionMap.current.get(uuid);
          if (existing) {
            existing.remove();
            previewRegionMap.current.delete(uuid);
          }
          return;
        }
        const { region: baseRegion, trackIndex } = baseRegionEntry;
        const handleColor = getTrackHandleColor(trackIndex);
        const contrast = createContrastColor(handleColor);
        const overlayFill = hexToRgba(contrast, 0.18);
        const overlayBorder = hexToRgba(contrast, 0.82);

        let overlay = previewRegionMap.current.get(uuid);
        if (!overlay) {
          overlay = regionsPlugin.addRegion({
            id: `preview-${uuid}`,
            start: data.startSeconds,
            end: data.endSeconds,
            drag: false,
            resize: false,
            color: overlayFill,
          });
          previewRegionMap.current.set(uuid, overlay);
        } else {
          overlay.setOptions({
            start: data.startSeconds,
            end: data.endSeconds,
            color: overlayFill,
          });
        }

        const element = overlay.element;
        if (element) {
          element.style.pointerEvents = "none";
          element.style.zIndex = "5";
          element.style.border = `2px dashed ${overlayBorder}`;
          element.style.backgroundColor = overlayFill;
          element.style.mixBlendMode = "screen";
          element.setAttribute("data-preview-region", "true");

          const baseElement = baseRegion.element;
          if (baseElement) {
            element.style.top = baseElement.style.top;
            element.style.height = baseElement.style.height;
            element.style.position = "absolute";
          }

          const leftHandle = element.querySelector(
            'div[part="region-handle region-handle-left"]',
          ) as HTMLDivElement | null;
          const rightHandle = element.querySelector(
            'div[part="region-handle region-handle-right"]',
          ) as HTMLDivElement | null;
          if (leftHandle) leftHandle.style.display = "none";
          if (rightHandle) rightHandle.style.display = "none";
        }
      });
    },
    [wavesurfer],
  );

  const initRegions = useCallback(() => {
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
    previewRegionMap.current.forEach((overlay) => {
      overlay.remove();
    });
    previewRegionMap.current.clear();

    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        const start = timeToSeconds(subtitle.startTime);
        const end = timeToSeconds(subtitle.endTime);

        const content = createSubtitleRegionContent(
          subtitle.startTime,
          subtitle.text,
          subtitle.endTime,
        );

        const regionColor = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
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
  }, [tracks, wavesurfer, measureLabelsOverlay, updatePreviewRegions]);

  useEffect(() => {
    if (!wavesurfer) return;
    const currentCount = tracks.length;
    if (prevTrackCountRef.current !== currentCount) {
      initRegions();
      prevTrackCountRef.current = currentCount;
    }
  }, [tracks.length, wavesurfer, initRegions, tracks]);

  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setIsLoading(false);
      initRegions();
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
    initRegions,
    tracks,
    activeTrackId,
    setActiveTrackId,
    onRegionClick,
    setIsLoading,
  ]);

  useEffect(() => {
    previewOffsetsRef.current = previewOffsets ?? {};
    updatePreviewRegions(previewOffsets ?? {});
  }, [previewOffsets, updatePreviewRegions]);

  useEffect(() => {
    return () => {
      previewRegionMap.current.forEach((region) => region.remove());
      previewRegionMap.current.clear();
    };
  }, []);

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
          );

          const regionColor = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
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
  }, [tracks, wavesurfer, measureLabelsOverlay]);

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
