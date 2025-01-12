"use client";

import { secondsToTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import { useWavesurfer } from "@wavesurfer/react";
import {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
  currentTime: number;
  isPlaying: boolean;
  subtitles: Subtitle[];
  onSeek: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onUpdateSubtitleTiming: (
    id: number,
    startTime: string,
    endTime: string
  ) => void;
  onUpdateSubtitleText: (id: number, newText: string) => void;
  onDeleteSubtitle: (id: number) => void;
}

export default forwardRef(function WaveformVisualizer(
  {
    mediaFile,
    currentTime,
    isPlaying,
    subtitles,
    onSeek,
    onPlayPause,
    onUpdateSubtitleTiming,
  }: WaveformVisualizerProps,
  ref: ForwardedRef<{ scrollToRegion: (id: number) => void }>
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const subtitleToRegionMap = useRef<Map<number, Region>>(new Map());

  // Load media file into wavesurfer
  useEffect(() => {
    if (mediaFile) {
      setIsLoading(true);
      setMediaUrl(URL.createObjectURL(mediaFile));
    } else {
      setMediaUrl("");
    }
  }, [mediaFile]);

  /****************************************************************
   *  Initialize the wavesurfer with options and plugins
   * */

  // Monkey patch the RegionPlug to avoid overlapping regions bug
  const regionPlugin = RegionsPlugin.create();

  // override the avoidOverlapping method, this method is a private method in the RegionPlugin
  (regionPlugin as any).avoidOverlapping = function (region: any) {
    // do nothing
  }

  const { wavesurfer } = useWavesurfer(
    useMemo(
      () => ({
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
              const paddedSeconds = String(
                Math.floor(remainingSeconds)
              ).padStart(2, "0");
              const paddedMilliseconds = String(milliseconds).padStart(3, "0");

              return `${paddedHours}:${paddedMinutes}:${paddedSeconds},${paddedMilliseconds}`;
            },
          }),
          regionPlugin,
        ],
      }),
      [mediaUrl]
    )
  );

  

  /****************************************************************
   * Scrolling and zooming the waveform
   */

  const scrollToRegion = useCallback(
    (id: number) => {
      if (!wavesurfer) return;
      const region = subtitleToRegionMap.current.get(id);
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
    },
    [wavesurfer, onSeek]
  );

  // Expose scrollToRegion method via ref
  useImperativeHandle(ref, () => ({
    scrollToRegion,
  }));

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

  // If the media player seeks, update the waveform progressß
  useEffect(() => {
    if (wavesurfer) {
      wavesurfer.setTime(currentTime);
    }
  }, [wavesurfer, currentTime]);

  // Handle play/pause with debounce
  const lastKeyPress = useRef(0);
  const DEBOUNCE_TIME = 200; // 200ms debounce

  // Hitting space key should play/pause the media
  const handlePlayPause = useCallback(() => {
    const now = Date.now();
    if (now - lastKeyPress.current < DEBOUNCE_TIME) return;
    lastKeyPress.current = now;
    onPlayPause(!isPlaying);
  }, [isPlaying, onPlayPause]);

  useEffect(() => {
    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      }
    };

    if (container) {
      container.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [handlePlayPause]);

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
  const initRegions = useCallback(() => {
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

      // Create the new region
      const region = regionsPlugin.addRegion({
        id: subtitle.id.toString(),
        start,
        end,
        content,
        color: REGION_COLOR,
        drag: true,
        resize: true,
        minLength: 0.1,
      });

      styleRegionHandles(region);

      // Save reference
      subtitleToRegionMap.current.set(subtitle.id, region);
    });
  }, [wavesurfer, subtitles]);

  // This is needed because if user loads the media first and then the subtitles,
  // the regions are not automatically rendered
  useEffect(() => {
    // When subtitles change, update the regions
    initRegions();
  }, [subtitles.length, initRegions]);

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
      // Dragged region id
      const subtitleId = Number.parseInt(region.id);
      let newStartTime = region.start;
      let newEndTime = region.end;
      let adjusted = false;

      // Check for overlaps with preceding and following regions and adjust times
      subtitleToRegionMap.current.forEach((otherRegion, otherId) => {
        if (otherId !== subtitleId) {
          if (
            newStartTime < otherRegion.end &&
            newEndTime > otherRegion.start
          ) {
            // Overlap detected
            adjusted = true;
            if (region.start < otherRegion.start) {
              // Adjust end time to be just before the start of the other region
              newEndTime = otherRegion.start;
            } else {
              // Adjust start time to be just after the end of the other region
              newStartTime = otherRegion.end;
            }
          }
        }
      });

      if (adjusted) {
        // Update the region with adjusted times
        region.setOptions({
          start: newStartTime,
          end: newEndTime,
        });
      }

      const newStartTimeFormatted = secondsToTime(newStartTime);
      const newEndTimeFormatted = secondsToTime(newEndTime);

      const subtitle = subtitles.find((s) => s.id === subtitleId);
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

      onUpdateSubtitleTiming(
        subtitleId,
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
  }, [wavesurfer, subtitles, onUpdateSubtitleTiming, initRegions]);

  // Update subtitle text requires only updating the target region content
  useEffect(() => {
    if (!wavesurfer) return;
    subtitles.map((subtitle) => {
      const region = subtitleToRegionMap.current.get(subtitle.id);
      if (region?.element) {
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
      <div
        ref={containerRef}
        className="w-full h-full"
        role="button"
        tabIndex={0}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center h-full">
          <div className="w-8 h-full border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});
