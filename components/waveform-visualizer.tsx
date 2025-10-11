"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useWavesurfer } from "@wavesurfer/react";
import {
  type ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import RegionsPlugin, {
  type Region,
} from "wavesurfer.js/dist/plugins/regions.esm.js";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { secondsToTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";

const HANDLE_COLOR = "#ef4444";

// Multi-track colors
const TRACK_COLORS = [
  "#fcd34d40", // Yellow (active track)
  "#3b82f640", // Blue
  "#ec489940", // Red
  "#84cc1640", // Green
];

const TRACK_HANDLE_COLORS = [
  "#f59e0b", // Yellow (active track)
  "#3b82f6", // Blue
  "#ec4899", // Red
  "#22c55e", // Green
];

const getContentHtml = (
  startTime: string,
  text: string,
  endTime: string,
): HTMLElement => {
  const content = document.createElement("div");
  // This is the style for the parent div of the region
  content.style.cssText += `
    display:flex; 
    flex-direction:column; 
    height:100%; 
    justify-content:space-between;
  `;

  content.innerHTML = `
    <div style="display: flex;
                justify-content: space-between; 
                flex-wrap:wrap; 
                padding-left: 1rem; 
                padding-right: 1rem; 
                padding-top: 0.3rem; 
                color: #525252;">
      <em>${startTime}</em>
      <em>${endTime}</em>
    </div>
    <div style="padding-left: 1rem; 
                padding-right: 1rem; 
                padding-bottom: 1rem; 
                font-size: 1rem; 
                color: #262626;">
      <span>${text}</span>
    </div>
`;

  return content;
};

const styleRegionHandles = (
  region: Region,
  handleColor: string = HANDLE_COLOR,
) => {
  // I have to do all these hakcy styling because the wavesurfer api doesn't allow custom styling regions
  if (!region.element) return;
  const leftHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-left"]',
  ) as HTMLDivElement;
  if (leftHandleDiv) {
    leftHandleDiv.style.cssText += `
      border-left: 2px dashed ${handleColor};
      width: 4px;
    `;
    // Add arrow only once
    if (!leftHandleDiv.querySelector('[data-arrow="left"]')) {
      const arrowEl = document.createElement("span");
      arrowEl.setAttribute("data-arrow", "left");
      arrowEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: -0.5rem;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 1rem solid transparent;
        border-bottom: 1rem solid transparent;
        border-right: 0.5rem solid ${handleColor};
      `;
      leftHandleDiv.appendChild(arrowEl);
    }
  }

  const rightHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-right"]',
  ) as HTMLDivElement;
  if (rightHandleDiv) {
    rightHandleDiv.style.cssText += `
      border-right: 2px dashed ${handleColor};
      width: 4px;
    `;
    if (!rightHandleDiv.querySelector('[data-arrow="right"]')) {
      const arrowEl = document.createElement("span");
      arrowEl.setAttribute("data-arrow", "right");
      arrowEl.style.cssText = `
        position: absolute;
        top: 50%;
        right: -0.5rem;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 1rem solid transparent;
        border-bottom: 1rem solid transparent;
        border-left: 0.5rem solid ${handleColor};
      `;
      rightHandleDiv.appendChild(arrowEl);
    }
  }
};

interface WaveformVisualizerProps {
  mediaFile: File | null;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onRegionClick?: (uuid: string, opts?: { crossTrack?: boolean }) => void;
}

export default forwardRef(function WaveformVisualizer(
  {
    mediaFile,
    isPlaying,
    onSeek,
    onPlayPause,
    onRegionClick,
  }: WaveformVisualizerProps,
  // Update the ref type to expect uuid (string) and the new setWaveformTime method
  ref: ForwardedRef<{
    scrollToRegion: (uuid: string) => void;
    setWaveformTime: (time: number) => void;
  }>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Get tracks, active track, and actions from context
  const {
    tracks,
    activeTrackId,
    setActiveTrackId,
    updateSubtitleTimeByUuidAction,
    showTrackLabels,
  } = useSubtitleContext();

  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  // Metrics to align track labels with actual regions area
  const [labelsOffsetTop, setLabelsOffsetTop] = useState(0);
  const [labelsAreaHeight, setLabelsAreaHeight] = useState(0);

  // Use UUID as the key for the map, store both region and track info
  const subtitleToRegionMap = useRef<
    Map<string, { region: Region; trackId: string }>
  >(new Map());

  // Track drag state to avoid repeated scroll triggers mid-drag
  // Dragging regions should not trigger auto scroll/tab switching

  // Load media file into wavesurfer
  useEffect(() => {
    if (!mediaFile) {
      setMediaUrl("");
      return;
    }

    setIsLoading(true);
    const objectUrl = URL.createObjectURL(mediaFile);
    setMediaUrl(objectUrl);

    // Clean up the object URL when the file changes or the component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [mediaFile]);

  /****************************************************************
   *  Initialize the wavesurfer with options and plugins
   * */

  // Monkey patch the RegionPlug to avoid overlapping regions bug
  const regionPlugin = RegionsPlugin.create();

  // biome-ignore lint/suspicious/noExplicitAny: Override the avoidOverlapping method, this method is a private method in the RegionPlugin
  (regionPlugin as any).avoidOverlapping = (_region: Region) => {
    // do nothing
  };

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: "auto",
    waveColor: "#A7F3D0",
    progressColor: "#00d4ff",
    cursorColor: "#b91c1c",
    url: mediaUrl,
    minPxPerSec: 100, // Lower default minimum pixels per second
    fillParent: true, // Start with fill parent true
    autoCenter: true, // Enable auto center initially
    backend: "MediaElement",
    normalize: true,
    interact: true,
    hideScrollbar: false, // We'll handle scrolling manually
    plugins: [
      Timeline.create({
        timeInterval: 0.1,
        primaryLabelInterval: 1,
        style: {
          fontSize: "12px",
        },
      }),
      Hover.create({
        lineColor: "#ff0000",
        lineWidth: 2,
        labelBackground: "#555",
        labelColor: "#fff",
        labelSize: "12px",
        formatTimeCallback: (seconds: number) => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const remainingSeconds = seconds % 60;
          const milliseconds = Math.round(
            (remainingSeconds - Math.floor(remainingSeconds)) * 1000,
          );

          const paddedHours = String(hours).padStart(2, "0");
          const paddedMinutes = String(minutes).padStart(2, "0");
          const paddedSeconds = String(Math.floor(remainingSeconds)).padStart(
            2,
            "0",
          );
          const paddedMilliseconds = String(milliseconds).padStart(3, "0");

          return `${paddedHours}:${paddedMinutes}:${paddedSeconds},${paddedMilliseconds}`;
        },
      }),
      regionPlugin,
    ],
  });

  /****************************************************************
   * Scrolling and zooming the waveform
   */

  // Accept uuid instead of id
  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToRegion: (uuid: string) => {
        if (!wavesurfer) return;
        const regionData = subtitleToRegionMap.current.get(uuid); // Use uuid to get region data
        if (regionData) {
          const region = regionData.region;
          const duration = wavesurfer.getDuration();
          const containerWidth = containerRef.current?.clientWidth || 0;
          const pixelsPerSecond = containerWidth / duration;
          const scrollPosition =
            region.start * pixelsPerSecond - containerWidth / 2;
          wavesurfer.setScroll(Math.max(0, scrollPosition));
          // Also seek to this position
          wavesurfer.setTime(region.start);
          onSeek(region.start);
        }
      },
      setWaveformTime: (time: number) => {
        if (!wavesurfer || wavesurfer.isSeeking()) return;

        const duration = wavesurfer.getDuration();
        if (time >= 0 && time <= duration) {
          const currentWsTime = wavesurfer.getCurrentTime();
          // Add a small tolerance to avoid fighting over tiny differences
          if (Math.abs(currentWsTime - time) > 0.05) {
            try {
              wavesurfer.setTime(time);
            } catch (error) {
              console.warn("wavesurfer.setTime failed:", error);
            }
          }
        }
      },
    }),
    [wavesurfer, onSeek], // Add dependencies
  );

  // Handle zoom level based on duration
  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.on("ready", () => {
        const duration = wavesurfer.getDuration();
        const containerWidth = containerRef.current?.clientWidth || 0;

        if (duration <= 30) {
          // For tracks under 30 seconds
          wavesurfer.zoom(containerWidth / duration); // Fit to container
        } else {
          wavesurfer.zoom(100); // Default zoom for longer tracks
          wavesurfer.setOptions({
            fillParent: false,
            autoCenter: false,
          });
        }
      });
    }
  }, [wavesurfer]);

  // Handle horizontal scrolling
  useEffect(() => {
    if (wavesurfer && containerRef.current) {
      const container = containerRef.current;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault(); // Prevent default vertical scrolling

        // Adjust the scroll amount as needed
        const scrollAmount = e.deltaY * 2;

        // Get the current scroll position
        const scrollLeft = wavesurfer.getScroll();

        // Calculate the new scroll position
        const newScrollLeft = scrollLeft + scrollAmount;

        // Set the new scroll position
        wavesurfer.setScroll(newScrollLeft);
      };

      container.addEventListener("wheel", handleWheel);

      return () => {
        container.removeEventListener("wheel", handleWheel);
      };
    }
  }, [wavesurfer]);

  /****************************************************************
   *  Sync the wavesurfer progress with the right panel media player
   *  */

  // If you click the waveform, seek to that position in the media player
  useEffect(() => {
    if (wavesurfer) {
      const handleSeek = (time: number) => {
        onSeek(time);
      };

      wavesurfer.on("interaction", handleSeek);

      return () => {
        wavesurfer.un("interaction", handleSeek);
      };
    }
  }, [wavesurfer, onSeek]);

  // The throttled time update logic has been removed.
  // The parent component will now call `setWaveformTime` directly.

  // Handle play/pause with debounce
  const lastKeyPress = useRef(0);
  const DEBOUNCE_TIME = 200; // 200ms debounce

  useEffect(() => {
    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation(); // Stop the event from bubbling up

        // Debounce logic moved inside
        const now = Date.now();
        if (now - lastKeyPress.current < DEBOUNCE_TIME) return;
        lastKeyPress.current = now;

        onPlayPause(!isPlaying); // Call prop directly
      }
    };

    if (container) {
      // Make container focusable to receive keydown events
      container.setAttribute("tabindex", "0");
      container.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
        // Clean up tabindex attribute
        container.removeAttribute("tabindex");
      }
    };
  }, [isPlaying, onPlayPause]); // Depend on isPlaying and onPlayPause

  // Play/pause the waveform
  useEffect(() => {
    if (!wavesurfer) return;

    try {
      if (isPlaying) {
        wavesurfer.play();
      } else {
        wavesurfer.pause();
      }
    } catch (error) {
      console.warn("Play/pause operation failed:", error);
    }
  }, [isPlaying, wavesurfer]);

  /****************************************************************
   * Handle subtitle region creation and updates
   *
   * There are 4 actions from the subtitle list that requires the waveform to re-render:
   * 1. Update the subtitle text
   * 2. Merge a subtitle
   * 3. Add a new subtitle
   * 4. Delete a subtitle
   *
   * For the first action, we only need to update the target region content.
   * For the other 3 actions, we need to re-render the regions list.
   *
   * And there is only 1 action from the waveform regions that requires the subtitle list
   * to re-render:
   * 1. Update the subtitle timing by dragging the region box
   *
   * And we only need to re-render the target region box.
   * */

  // Track which subtitle was just dragged to avoid re-rendering it
  const lastDraggedSubtitleId = useRef<string | null>(null);

  // Initialize all regions from all tracks
  const initRegions = () => {
    if (!wavesurfer || wavesurfer.getDuration() === 0) return;

    // Grab the plugin by name in Wavesurfer v7
    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((p) => p instanceof RegionsPlugin);
    if (!regionsPlugin) return;

    // 1) Remove existing regions and clear references
    const regions = regionsPlugin.getRegions();
    regions.forEach((region) => {
      region.remove();
    });
    regionsPlugin.clearRegions();
    subtitleToRegionMap.current.clear();

    // 2) Add regions from all tracks
    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        const start = timeToSeconds(subtitle.startTime);
        const end = timeToSeconds(subtitle.endTime);

        const content = getContentHtml(
          subtitle.startTime,
          subtitle.text,
          subtitle.endTime,
        );

        // Get colors for this track
        const regionColor = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
        const handleColor =
          TRACK_HANDLE_COLORS[trackIndex % TRACK_HANDLE_COLORS.length];

        // Create the new region using uuid as the ID
        const region = regionsPlugin.addRegion({
          id: subtitle.uuid, // Use uuid for region ID
          start,
          end,
          content,
          color: regionColor,
          drag: true,
          resize: true,
          minLength: 0.1,
        });

        // Position the region vertically based on track
        if (region.element) {
          const trackHeight = 100 / tracks.length; // Percentage height per track
          const trackTop = trackIndex * trackHeight;
          region.element.style.top = `${trackTop}%`;
          region.element.style.height = `${trackHeight}%`;
          region.element.style.position = "absolute";
        }

        styleRegionHandles(region, handleColor);

        // Save reference using uuid as the key, including track info
        subtitleToRegionMap.current.set(subtitle.uuid, {
          region,
          trackId: track.id,
        });
      });
    });
    // After creating regions, measure label overlay area
    requestAnimationFrame(measureLabelsOverlay);
  };

  const measureLabelsOverlay = () => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    let laneHeight = 0;
    let topOfFirstLanePx: number | null = null;

    // Derive lane height and the absolute top of lane 0 using any region element
    subtitleToRegionMap.current.forEach(({ region, trackId }) => {
      if (!region.element) return;
      const el = region.element as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        laneHeight = rect.height; // all lanes share height
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
  };

  // Full re-init when the number of tracks changes (robust lane resizing)
  const prevTrackCountRef = useRef<number>(tracks.length);
  useEffect(() => {
    if (!wavesurfer) return;
    const current = tracks.length;
    if (prevTrackCountRef.current !== current) {
      initRegions();
      prevTrackCountRef.current = current;
    }
  }, [tracks.length, wavesurfer]);

  // If subtitle time stamps change, update the regions
  // biome-ignore lint/correctness/useExhaustiveDependencies: For unknown reasons, if I include `onPlayPause` in the dependencies, the regions are not rendered at all.
  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setIsLoading(false);
      // Build regions once initially
      initRegions();
      wavesurfer.setMuted(true);
      requestAnimationFrame(measureLabelsOverlay);
    };

    // If the user clicks "play" on the waveform, ensure it's muted and sync with parent
    const handlePlay = () => {
      wavesurfer.setMuted(true);
      onPlayPause(true); // Only update the parent state
    };

    // If the user clicks "pause" on the waveform, sync with parent
    const handlePause = () => {
      onPlayPause(false); // Only update the parent state
    };

    // Called whenever a region is dragged/resized
    const handleRegionUpdate = (region: Region) => {
      // The region.id is now the UUID (string)
      const subtitleUuid = region.id;
      let newStartTime = region.start;
      let newEndTime = region.end;
      let adjusted = false;

      // Find the corresponding subtitle object using UUID from all tracks
      let currentSubtitle: Subtitle | undefined;
      let currentTrack: SubtitleTrack | undefined;

      for (const track of tracks) {
        currentSubtitle = track.subtitles.find((s) => s.uuid === subtitleUuid);
        if (currentSubtitle) {
          currentTrack = track;
          break;
        }
      }

      if (!currentSubtitle || !currentTrack) return; // Should not happen if map is correct

      /** The following codes checks the drag-and-drop behavior of regions
       * 1. If the region is dragged to pass over the preceding or following
       *  region completely, i.e. the start time is later than the end time
       *  of the following region, or the end time is earlier than the start
       *  time of the preceding region), it will be reverted to its original
       *  position.
       * 2. If the region is dragged to partially overlap with other regions,
       *  it will be adjusted to avoid overlapping.
       */

      // Sort regions within the same track based on their start time
      const trackRegions = Array.from(subtitleToRegionMap.current.values())
        .filter((regionData) => regionData.trackId === currentTrack.id)
        .map((regionData) => regionData.region)
        .sort((a, b) => a.start - b.start);

      // Find the index of the current region in the time-sorted list for this track
      const currentIndex = trackRegions.findIndex((r) => r.id === subtitleUuid);

      // Get previous and next regions based on time order within the same track
      const prevRegion =
        currentIndex > 0 ? trackRegions[currentIndex - 1] : null;
      const nextRegion =
        currentIndex < trackRegions.length - 1
          ? trackRegions[currentIndex + 1]
          : null;

      // Check for complete overlap with previous or next region (using time-sorted neighbors)
      if (
        (prevRegion && newEndTime <= prevRegion.start) || // Adjusted logic: end time before prev start
        (nextRegion && newStartTime >= nextRegion.end) // Adjusted logic: start time after next end
      ) {
        // Completely passed over, revert to original position
        // Find original subtitle using UUID from current track
        const originalSubtitle = currentTrack.subtitles.find(
          (s) => s.uuid === subtitleUuid,
        );
        if (originalSubtitle) {
          const originalStartTime = timeToSeconds(originalSubtitle.startTime);
          const originalEndTime = timeToSeconds(originalSubtitle.endTime);

          // Revert the region to its original position
          region.setOptions({
            start: originalStartTime,
            end: originalEndTime,
          });

          // Update the content to match original times
          region.setOptions({
            content: getContentHtml(
              originalSubtitle.startTime,
              originalSubtitle.text,
              originalSubtitle.endTime,
            ),
          });

          // Get the correct handle color for this track
          const trackIndex = tracks.findIndex((t) => t.id === currentTrack.id);
          const handleColor =
            TRACK_HANDLE_COLORS[trackIndex % TRACK_HANDLE_COLORS.length];
          styleRegionHandles(region, handleColor);
        }
        return; // Exit without updating subtitle timing
      }

      // Adjust for partial overlap with time-sorted neighbors
      if (prevRegion && newStartTime < prevRegion.end) {
        // Overlaps with previous region's end
        adjusted = true;
        newStartTime = prevRegion.end;
        // Ensure minimum duration if adjustment makes start >= end
        if (newStartTime >= newEndTime) {
          newEndTime = newStartTime + 0.1; // Add small duration
        }
      }
      if (nextRegion && newEndTime > nextRegion.start) {
        // Overlaps with next region's start
        adjusted = true;
        newEndTime = nextRegion.start;
        // Ensure minimum duration if adjustment makes end <= start
        if (newEndTime <= newStartTime) {
          newStartTime = newEndTime - 0.1; // Subtract small duration
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

      // Find subtitle by UUID to update content from current track
      const subtitle = currentTrack.subtitles.find(
        (s) => s.uuid === subtitleUuid,
      );
      if (subtitle) {
        region.setOptions({
          content: getContentHtml(
            newStartTimeFormatted,
            subtitle.text,
            newEndTimeFormatted,
          ),
        });

        // Get the correct handle color for this track
        const trackIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const handleColor =
          TRACK_HANDLE_COLORS[trackIndex % TRACK_HANDLE_COLORS.length];
        styleRegionHandles(region, handleColor);
      }

      // Mark this subtitle as being dragged to avoid re-rendering it
      lastDraggedSubtitleId.current = subtitleUuid;

      // Do not auto switch tabs or scroll during drag; only update times

      // Call context action with the UUID to update the correct subtitle in the correct track
      updateSubtitleTimeByUuidAction(
        subtitleUuid, // Pass the UUID to find the correct subtitle
        newStartTimeFormatted,
        newEndTimeFormatted,
      );
      requestAnimationFrame(measureLabelsOverlay);
    };

    // Handle region clicks to switch active track and focus subtitle
    const handleRegionClick = (region: Region) => {
      const regionData = subtitleToRegionMap.current.get(region.id);
      if (regionData) {
        // Switch to the correct track if it's different
        if (regionData.trackId !== activeTrackId) {
          setActiveTrackId(regionData.trackId);
          // If we switched tracks, use a reliable timeout to ensure track switch completes
          if (onRegionClick) {
            setTimeout(() => {
              onRegionClick(region.id, { crossTrack: true });
            }, 150); // Reliable delay to ensure track switch and re-render complete
          }
        } else {
          // Same track, call immediately
          if (onRegionClick) {
            onRegionClick(region.id, { crossTrack: false });
          }
        }
      }
    };

    // Register events
    wavesurfer.on("ready", handleReady);
    wavesurfer.on("play", handlePlay);
    wavesurfer.on("pause", handlePause);

    // Or if you want to do something on "region-updated":
    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((p) => p instanceof RegionsPlugin) as RegionsPlugin;
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
      // Cleanup
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
    tracks,
    activeTrackId,
    setActiveTrackId,
    updateSubtitleTimeByUuidAction,
  ]); // Depend on context action

  // Re-measure label overlay when labels are toggled or track count changes
  useEffect(() => {
    requestAnimationFrame(measureLabelsOverlay);
  }, [showTrackLabels, tracks.length]);

  // Re-measure on window resize
  useEffect(() => {
    const onResize = () => requestAnimationFrame(measureLabelsOverlay);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Update subtitle text requires only updating the target region content
  useEffect(() => {
    if (!wavesurfer) return;
    // Avoid creating/updating regions until media is loaded and duration is known
    const duration = (() => {
      try {
        return wavesurfer.getDuration();
      } catch {
        return 0;
      }
    })();
    if (!duration || duration === 0) return;

    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((p) => p instanceof RegionsPlugin) as RegionsPlugin;
    if (!regionsPlugin) return;

    // Process all subtitles from all tracks
    tracks.forEach((track, trackIndex) => {
      track.subtitles.forEach((subtitle) => {
        // Skip the region that was just dragged to avoid double-rendering
        if (subtitle.uuid === lastDraggedSubtitleId.current) {
          return;
        }

        // Get region data by UUID
        const regionData = subtitleToRegionMap.current.get(subtitle.uuid);

        // If region doesn't exist, create it (edge case handling)
        if (!regionData) {
          const start = timeToSeconds(subtitle.startTime);
          const end = timeToSeconds(subtitle.endTime);
          const content = getContentHtml(
            subtitle.startTime,
            subtitle.text,
            subtitle.endTime,
          );

          // Get colors for this track
          const regionColor = TRACK_COLORS[trackIndex % TRACK_COLORS.length];
          const handleColor =
            TRACK_HANDLE_COLORS[trackIndex % TRACK_HANDLE_COLORS.length];

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

          // Position the region vertically based on track
          if (region.element) {
            const trackHeight = 100 / tracks.length; // Percentage height per track
            const trackTop = trackIndex * trackHeight;
            region.element.style.top = `${trackTop}%`;
            region.element.style.height = `${trackHeight}%`;
            region.element.style.position = "absolute";
          }

          styleRegionHandles(region, handleColor);
          subtitleToRegionMap.current.set(subtitle.uuid, {
            region,
            trackId: track.id,
          });
        } else if (regionData.region.element) {
          // Update existing region
          const region = regionData.region;
          const newStart = timeToSeconds(subtitle.startTime);
          const newEnd = timeToSeconds(subtitle.endTime);

          // Check if times actually changed before updating the region object
          if (region.start !== newStart || region.end !== newEnd) {
            region.setOptions({
              start: newStart,
              end: newEnd,
            });
          }

          // Always update the displayed content (HTML)
          region.setOptions({
            content: getContentHtml(
              subtitle.startTime,
              subtitle.text,
              subtitle.endTime,
            ),
          });

          // Get colors for this track
          const handleColor =
            TRACK_HANDLE_COLORS[trackIndex % TRACK_HANDLE_COLORS.length];
          styleRegionHandles(region, handleColor);

          // Update vertical positioning based on current track index and total tracks
          const el = region.element as HTMLElement | null;
          if (el) {
            const trackHeight = 100 / tracks.length;
            const trackTop = trackIndex * trackHeight;
            el.style.top = `${trackTop}%`;
            el.style.height = `${trackHeight}%`;
            el.style.position = "absolute";
          }
        }
      });
    });

    // Clean up regions that no longer have corresponding subtitles
    const allSubtitleUuids = new Set();
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

    // After creating/updating/cleaning regions, re-measure label overlay
    requestAnimationFrame(measureLabelsOverlay);
  }, [tracks, wavesurfer]);

  return (
    <div className="relative w-full h-full border-black">
      <div ref={containerRef} className="w-full h-full" />
      {showTrackLabels && tracks.length > 0 && labelsAreaHeight > 0 && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            top: `${labelsOffsetTop}px`,
            height: `${labelsAreaHeight}px`,
            zIndex: 10,
          }}
        >
          {tracks.map((track, idx) => (
            <div
              key={track.id}
              className="absolute left-2 bg-neutral-500 text-white px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                top: `${((idx + 0.5) * 100) / tracks.length}%`,
                transform: "translateY(-50%)",
              }}
            >
              {track.name}
            </div>
          ))}
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          {/* Added subtle background */}
          <IconLoader2 className="text-3xl text-black animate-spin" />
        </div>
      )}
    </div>
  );
});
