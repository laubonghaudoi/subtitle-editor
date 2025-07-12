"use client";

import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { secondsToTime, timeToSeconds } from "@/lib/utils";
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

const HANDLE_COLOR = "#f59e0b";
const REGION_COLOR = "#fcd34d40";

const getContentHtml = (
  startTime: string,
  text: string,
  endTime: string
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
                padding-top: 1rem; 
                color: #525252;">
      <em>${startTime}</em>
      <em>${endTime}</em>
    </div>
    <div style="padding-left: 1rem; 
                padding-right: 1rem; 
                padding-bottom: 1.5rem; 
                font-size: 1rem; 
                color: #262626;">
      <span>${text}</span>
    </div>
`;

  return content;
};

const styleRegionHandles = (region: Region) => {
  // I have to do all these hakcy styling because the wavesurfer api doesn't allow custom styling regions
  if (!region.element) return;
  const leftHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-left"]'
  ) as HTMLDivElement;
  if (leftHandleDiv) {
    leftHandleDiv.style.cssText += `
      border-left: 2px dashed ${HANDLE_COLOR};
      width: 4px;
    `;
    // Create a child <span> to act as the arrow
    const arrowEl = document.createElement("span");
    arrowEl.style.cssText = `
      position: absolute;
      top: 50%;
      left: -0.5rem;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 1rem solid transparent;
      border-bottom: 1rem solid transparent;
      border-right: 0.5rem solid ${HANDLE_COLOR};
    `;
    leftHandleDiv.appendChild(arrowEl);
  }

  const rightHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-right"]'
  ) as HTMLDivElement;
  if (rightHandleDiv) {
    rightHandleDiv.style.cssText += `
      border-right: 2px dashed ${HANDLE_COLOR};
      width: 4px;
    `;
    const arrowEl = document.createElement("span");
    arrowEl.style.cssText = `
      position: absolute;
      top: 50%;
      right: -0.5rem;
      transform: translateY(-50%);
      width: 0;
      height: 0;
      border-top: 1rem solid transparent;
      border-bottom: 1rem solid transparent;
      border-left: 0.5rem solid ${HANDLE_COLOR};
    `;
    rightHandleDiv.appendChild(arrowEl);
  }
};

interface WaveformVisualizerProps {
  mediaFile: File | null;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
}

export default forwardRef(function WaveformVisualizer(
  {
    mediaFile,
    isPlaying,
    onSeek,
    onPlayPause,
  }: WaveformVisualizerProps,
  // Update the ref type to expect uuid (string) and the new setWaveformTime method
  ref: ForwardedRef<{
    scrollToRegion: (uuid: string) => void;
    setWaveformTime: (time: number) => void;
  }>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Get subtitles and actions from context
  const { subtitles, updateSubtitleTimeAction } = useSubtitleContext();

  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Use UUID as the key for the map
  const subtitleToRegionMap = useRef<Map<string, Region>>(new Map());

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
  (regionPlugin as any).avoidOverlapping = (region: Region) => {
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
            (remainingSeconds - Math.floor(remainingSeconds)) * 1000
          );

          const paddedHours = String(hours).padStart(2, "0");
          const paddedMinutes = String(minutes).padStart(2, "0");
          const paddedSeconds = String(Math.floor(remainingSeconds)).padStart(
            2,
            "0"
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
  const scrollToRegion = (uuid: string) => {
    if (!wavesurfer) return;
    const region = subtitleToRegionMap.current.get(uuid); // Use uuid to get region
    if (region) {
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
  };

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToRegion,
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
    [wavesurfer, scrollToRegion] // Add dependencies
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
   * And there is only 1 action from the wavefrom regions that requires the subtitle list
   * to re-render:
   * 1. Update the subtitle timing by draging the region box
   *
   * And we only need to re-render the target region box.
   * */

  // Initialize all regions from subtitles
  const initRegions = () => {
    if (!wavesurfer || wavesurfer.getDuration() === 0) return;

    // Grab the plugin by name in Wavesurfer v7
    const regionsPlugin = wavesurfer
      .getActivePlugins()
      .find((p) => p instanceof RegionsPlugin);
    if (!regionsPlugin) return;

    // 1) Remove existing regions and clear references
    const regions = regionsPlugin.getRegions();
    regions.map((region) => {
      region.remove();
    });
    regionsPlugin.clearRegions();
    subtitleToRegionMap.current.clear();

    // 2) Add them back in fresh
    subtitles.map((subtitle) => {
      const start = timeToSeconds(subtitle.startTime);
      const end = timeToSeconds(subtitle.endTime);

      const content = getContentHtml(
        subtitle.startTime,
        subtitle.text,
        subtitle.endTime
      );

      // Create the new region using uuid as the ID
      const region = regionsPlugin.addRegion({
        id: subtitle.uuid, // Use uuid for region ID
        start,
        end,
        content,
        color: REGION_COLOR,
        drag: true,
        resize: true,
        minLength: 0.1,
      });

      styleRegionHandles(region);

      // Save reference using uuid as the key
      subtitleToRegionMap.current.set(subtitle.uuid, region);
    });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Avoid infinite rendering regions - We need to re-run when subtitles change.
  useEffect(() => {
    if (!wavesurfer || isLoading || !wavesurfer.getDuration()) return;
    // When subtitles change, update the regions
    initRegions();
  }, [subtitles, wavesurfer, isLoading]);

  // If subtitle time stamps change, update the regions
  // biome-ignore lint/correctness/useExhaustiveDependencies: For unknown reasons, if I include `onPlayPause` in the dependencies, the regions are not rendered at all.
  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setIsLoading(false);
      // Build regions once initially
      initRegions();
      wavesurfer.setMuted(true);
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

      // Find the corresponding subtitle object using UUID
      const currentSubtitle = subtitles.find((s) => s.uuid === subtitleUuid);
      if (!currentSubtitle) return; // Should not happen if map is correct
      const subtitleId = currentSubtitle.id; // Get the SRT ID for comparison logic if needed

      /** The following codes checks the drag-and-drop behavior of regions
       * 1. If the region is dragged to pass over the preceding or following
       *  region completely, i.e. the start time is later than the end time
       *  of the following region, or the end time is earlier than the start
       *  time of the preceding region), it will be reverted to its original
       *  position.
       * 2. If the region is dragged to partially overlap with other regions,
       *  it will be adjusted to avoid overlapping.
       */

      // Sort regions based on their start time or original SRT ID if needed for ordering logic
      // Sorting by UUID might not give chronological order. Let's sort by start time.
      const sortedRegions = Array.from(
        subtitleToRegionMap.current.values()
      ).sort((a, b) => a.start - b.start);

      // Find the index of the current region in the time-sorted list
      const currentIndex = sortedRegions.findIndex(
        (r) => r.id === subtitleUuid
      );

      // Get previous and next regions based on time order
      const prevRegion =
        currentIndex > 0 ? sortedRegions[currentIndex - 1] : null; // Access Region directly
      const nextRegion =
        currentIndex < sortedRegions.length - 1
          ? sortedRegions[currentIndex + 1] // Access Region directly
          : null;

      // Check for complete overlap with previous or next region (using time-sorted neighbors)
      if (
        (prevRegion && newEndTime <= prevRegion.start) || // Adjusted logic: end time before prev start
        (nextRegion && newStartTime >= nextRegion.end) // Adjusted logic: start time after next end
      ) {
        // Completely passed over, revert to original position
        // Find original subtitle using UUID
        const originalSubtitle = subtitles.find((s) => s.uuid === subtitleUuid);
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
              originalSubtitle.endTime
            ),
          });

          styleRegionHandles(region);
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

      // Find subtitle by UUID to update content
      const subtitle = subtitles.find((s) => s.uuid === subtitleUuid);
      if (subtitle) {
        region.setOptions({
          content: getContentHtml(
            newStartTimeFormatted,
            subtitle.text,
            newEndTimeFormatted
          ),
        });

        styleRegionHandles(region);
      }

      // Call context action with the SRT ID
      updateSubtitleTimeAction(
        subtitleId, // Pass the SRT ID
        newStartTimeFormatted,
        newEndTimeFormatted
      );
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
    }

    return () => {
      // Cleanup
      wavesurfer.un("ready", handleReady);
      wavesurfer.un("play", handlePlay);
      wavesurfer.un("pause", handlePause);
      if (regionsPlugin) {
        regionsPlugin.un("region-updated", handleRegionUpdate);
      }
    };
  }, [wavesurfer, subtitles, updateSubtitleTimeAction]); // Depend on context action

  // Update subtitle text requires only updating the target region content
  useEffect(() => {
    if (!wavesurfer) return;
    subtitles.map((subtitle) => {
      // Get region by UUID
      const region = subtitleToRegionMap.current.get(subtitle.uuid);
      if (region?.element) {
        // Update region's start and end times if they differ
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
            subtitle.endTime
          ),
        });

        styleRegionHandles(region);
      }
    });
  }, [subtitles, wavesurfer]);

  return (
    <div className="relative w-full h-full border-black">
      <div ref={containerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          {/* Added subtle background */}
          <IconLoader2 className="text-3xl text-black animate-spin" />
        </div>
      )}
    </div>
  );
});
