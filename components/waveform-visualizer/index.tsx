"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useWavesurfer } from "@wavesurfer/react";
import type { ForwardedRef } from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Hover from "wavesurfer.js/dist/plugins/hover.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
import {
  useSubtitleActionsContext,
  useSubtitleState,
} from "@/context/subtitle-context";
import { useWaveformRegions } from "./use-waveform-regions";
import type { BulkOffsetPreviewState } from "@/components/bulk-offset/drawer";
import { useTheme } from "next-themes";

interface WaveformVisualizerProps {
  mediaFile: File | null;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onRegionClick?: (uuid: string, opts?: { crossTrack?: boolean }) => void;
  previewOffsets?: Record<string, BulkOffsetPreviewState>;
}

export default forwardRef(function WaveformVisualizer(
  {
    mediaFile,
    isPlaying,
    onSeek,
    onPlayPause,
    onRegionClick,
    previewOffsets = {},
  }: WaveformVisualizerProps,
  ref: ForwardedRef<{
    scrollToRegion: (uuid: string) => void;
    setWaveformTime: (time: number) => void;
  }>,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" =
    resolvedTheme === "dark" ? "dark" : "light";
  const waveColor = theme === "dark" ? "#0f766e" : "#A7F3D0";
  const progressColor = theme === "dark" ? "#0ea5e9" : "#00d4ff";

  const {
    tracks,
    activeTrackId,
    setActiveTrackId,
    showTrackLabels,
    clampOverlaps,
  } = useSubtitleState();
  const { updateSubtitleTimeByUuidAction } = useSubtitleActionsContext();

/****************************************************************
 *  Load media file into wavesurfer
 * */
  useEffect(() => {
    if (!mediaFile) {
      setMediaUrl("");
      return;
    }

    setIsLoading(true);
    const objectUrl = URL.createObjectURL(mediaFile);
    setMediaUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [mediaFile]);

  const regionPlugin = RegionsPlugin.create();
  Reflect.set(
    regionPlugin as unknown as Record<string, unknown>,
    "avoidOverlapping",
    () => {
      // Override the private avoidOverlapping helper to allow intersecting regions
    },
  );

  /****************************************************************
   *  Initialize the wavesurfer with options and plugins
   * */
  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: "auto",
    waveColor,
    progressColor,
    cursorColor: "#b91c1c",
    url: mediaUrl,
    minPxPerSec: 100,
    fillParent: true,
    autoCenter: true,
    backend: "MediaElement",
    normalize: true,
    interact: true,
    hideScrollbar: false,
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

  useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.setOptions({
      waveColor,
      progressColor,
    });
  }, [wavesurfer, waveColor, progressColor]);
  /****************************************************************
   *  Hook the region lifecycle and track overlays into a standalone hook
   * */
  const {
    subtitleToRegionMap,
    labelsOffsetTop,
    labelsAreaHeight,
  } = useWaveformRegions({
    wavesurfer: wavesurfer ?? null,
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
  });

  /****************************************************************
   * Scrolling and zooming the waveform
   */

  useImperativeHandle(
    ref,
    () => ({
      // Accept uuid instead of id
      // Expose methods via ref
      scrollToRegion: (uuid: string) => {
        if (!wavesurfer) return;
        const regionData = subtitleToRegionMap.current.get(uuid);
        if (regionData) {
          const region = regionData.region;
          const duration = wavesurfer.getDuration();
          const containerWidth = containerRef.current?.clientWidth || 0;
          const pixelsPerSecond = duration
            ? containerWidth / duration
            : containerWidth;
          const scrollPosition =
            region.start * pixelsPerSecond - containerWidth / 2;
          wavesurfer.setScroll(Math.max(0, scrollPosition));
          wavesurfer.setTime(region.start);
          onSeek(region.start);
        }
      },
      setWaveformTime: (time: number) => {
        if (!wavesurfer || wavesurfer.isSeeking()) return;
        const duration = wavesurfer.getDuration();
        // The throttled time update logic has been removed.
        // The parent component will now call `setWaveformTime` directly.
        if (time >= 0 && time <= duration) {
          const currentWsTime = wavesurfer.getCurrentTime();
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
    [wavesurfer, onSeek, subtitleToRegionMap],
  );

  // Handle zoom level based on duration
  useEffect(() => {
    if (!wavesurfer) return;
    const handleReady = () => {
      const duration = wavesurfer.getDuration();
      const containerWidth = containerRef.current?.clientWidth || 0;

      if (duration <= 30) {
        wavesurfer.zoom(containerWidth / duration);
      } else {
        wavesurfer.zoom(100);
        wavesurfer.setOptions({
          fillParent: false,
          autoCenter: false,
        });
      }
    };

    wavesurfer.on("ready", handleReady);
    return () => {
      wavesurfer.un("ready", handleReady);
    };
  }, [wavesurfer]);

  // Handle horizontal scrolling
  useEffect(() => {
    if (!wavesurfer || !containerRef.current) return;
    const container = containerRef.current;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scrollAmount = event.deltaY * 2;
      const scrollLeft = wavesurfer.getScroll();
      wavesurfer.setScroll(scrollLeft + scrollAmount);
    };

    container.addEventListener("wheel", handleWheel);
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [wavesurfer]);

  /****************************************************************
   *  Sync the wavesurfer progress with the right panel media player
   *  */

  // If you click the waveform, seek to that position in the media player
  useEffect(() => {
    if (!wavesurfer) return;

    const handleSeek = (time: number) => {
      onSeek(time);
    };

    wavesurfer.on("interaction", handleSeek);

    return () => {
      wavesurfer.un("interaction", handleSeek);
    };
  }, [wavesurfer, onSeek]);

  // Handle play/pause with debounce
  const lastKeyPress = useRef(0);
  const DEBOUNCE_TIME = 200;

  useEffect(() => {
    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        const now = Date.now();
        if (now - lastKeyPress.current < DEBOUNCE_TIME) return;
        lastKeyPress.current = now;
        onPlayPause(!isPlaying);
      }
    };

    if (container) {
      container.setAttribute("tabindex", "0");
      container.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (container) {
        container.removeEventListener("keydown", handleKeyDown);
        container.removeAttribute("tabindex");
      }
    };
  }, [isPlaying, onPlayPause]);

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
              className="absolute left-2 bg-neutral-500 text-white dark:bg-slate-200 dark:text-slate-900 px-2 py-0.5 rounded text-xs font-semibold"
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
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/40">
          <IconLoader2 className="text-3xl text-black dark:text-white animate-spin" />
        </div>
      )}
    </div>
  );
});
