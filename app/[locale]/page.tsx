"use client"; // Ensure this is the very first line

import { AppHeader } from "@/components/app-header";
import BottomInstructions from "@/components/bottom-instructions";
import type {
  BulkOffsetDrawerProps,
  BulkOffsetPreviewState,
} from "@/components/bulk-offset/drawer";
import CustomControls from "@/components/custom-controls";
import SkipLinks from "@/components/skip-links";
import type { SubtitleListRef } from "@/components/subtitle/subtitle-list";
import TrackTabs from "@/components/subtitle/track-tabs";
import type {
  VideoPlayerHandle,
  VideoPlayerProps,
} from "@/components/video-player";
import {
  SubtitleProvider,
  useSubtitleActionsContext,
  useSubtitleHistory,
  useSubtitleState,
  useSubtitles,
} from "@/context/subtitle-context";
import { useDroppablePanel } from "@/hooks/use-droppable-panel";
import { useSubtitleShortcuts } from "@/hooks/use-subtitle-shortcuts";
import { isMediaFile, isSubtitleFile } from "@/lib/file-utils";
import {
  extractVttPrologue,
  parseSRT,
  parseVTT,
} from "@/lib/subtitle-operations";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type {
  DragEvent,
  ForwardRefExoticComponent,
  RefAttributes,
} from "react";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const VideoPlayer = dynamic<VideoPlayerProps>(
  () => import("@/components/video-player"),
  {
    ssr: false, // Disable server-side rendering
  },
) as ForwardRefExoticComponent<
  VideoPlayerProps & RefAttributes<VideoPlayerHandle>
>;

const WaveformVisualizer = dynamic(
  () => import("@/components/waveform-visualizer"),
  {
    ssr: false, // Disable server-side rendering
  },
);

const BulkOffsetDrawer = dynamic<BulkOffsetDrawerProps>(
  () =>
    import("@/components/bulk-offset/drawer").then(
      (mod) => mod.BulkOffsetDrawer,
    ),
  {
    loading: () => null,
    ssr: false,
  },
);

interface WaveformRef {
  scrollToRegion: (uuid: string) => void;
  setWaveformTime: (time: number) => void;
}

// Define the main content component that will consume the context
function MainContent() {
  const t = useTranslations();
  const waveformRef = useRef<WaveformRef>(null);
  const subtitleListRef = useRef<SubtitleListRef>(null);
  const videoPlayerRef = useRef<VideoPlayerHandle | null>(null);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  // Get subtitle state and actions from context
  const { tracks, activeTrackId, setActiveTrackId } = useSubtitleState();
  const subtitles = useSubtitles();
  const {
    setInitialSubtitles, // Use this instead of setSubtitlesWithHistory
    loadSubtitlesIntoTrack,
    renameTrack,
    bulkShiftSubtitlesAction,
  } = useSubtitleActionsContext();
  const { undoSubtitles, redoSubtitles, canUndoSubtitles, canRedoSubtitles } =
    useSubtitleHistory();
  // Keep page-specific state here

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string>(
    t("buttons.loadMedia"),
  );
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [jumpDuration, setJumpDuration] = useState(5);
  // State to track which subtitle is being edited
  const [editingSubtitleUuid, setEditingSubtitleUuid] = useState<string | null>(
    null,
  );

  // State to track pending scroll-to-region after track switch
  const [pendingScrollToUuid, setPendingScrollToUuid] = useState<string | null>(
    null,
  );
  // Whether the pending scroll should be instant (used for cross-track clicks)
  const [pendingScrollInstant, setPendingScrollInstant] =
    useState<boolean>(false);
  const [isBulkOffsetOpen, setIsBulkOffsetOpen] = useState<boolean>(false);
  const [bulkOffsetPreview, setBulkOffsetPreview] = useState<
    Record<string, BulkOffsetPreviewState>
  >({});
  const resumeMediaPlayback = () => {
    videoPlayerRef.current?.resumePlayback();
  };

  const activeTrackIndex = activeTrackId
    ? tracks.findIndex((track) => track.id === activeTrackId)
    : -1;
  const activeTrack =
    activeTrackIndex >= 0 ? (tracks[activeTrackIndex] ?? null) : null;
  const activeTrackIsEmpty =
    activeTrack !== null && activeTrack.subtitles.length === 0;
  const activeTrackSubtitles = activeTrack?.subtitles ?? [];
  const allowSubtitleDrop = tracks.length === 0 || activeTrackIsEmpty;
  const bulkOffsetDisabled = !activeTrack || activeTrackSubtitles.length === 0;
  const loadMediaFile = (file: File) => {
    setMediaFile(null);
    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = "";
    }
    setTimeout(() => {
      setMediaFile(file);
      setMediaFileName(file.name);
    }, 0);
  };

  const loadSubtitleFile = async (file: File) => {
    const text = await file.text();
    const firstLine =
      text.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
    const isVtt =
      file.name.toLowerCase().endsWith(".vtt") ||
      /^WEBVTT( |$)/.test(firstLine);
    const parsedSubtitles = isVtt ? parseVTT(text) : parseSRT(text);
    const meta = isVtt ? extractVttPrologue(text) : undefined;
    const safeTrackName = file.name.replace(/\.(srt|vtt)$/i, "") || file.name;

    if (activeTrackId && activeTrackIsEmpty) {
      loadSubtitlesIntoTrack(
        activeTrackId,
        parsedSubtitles,
        meta
          ? { vttHeader: meta.header, vttPrologue: meta.prologue }
          : undefined,
      );
      renameTrack(activeTrackId, safeTrackName);
      return;
    }

    setInitialSubtitles(
      parsedSubtitles,
      safeTrackName,
      meta ? { vttHeader: meta.header, vttPrologue: meta.prologue } : undefined,
    );
  };

  const handleStartFromScratch = () => {
    setInitialSubtitles(
      [
        {
          uuid: uuidv4(),
          id: 1,
          startTime: "00:00:00,000",
          endTime: "00:00:03,000",
          text: t("subtitle.newSubtitle"),
        },
      ],
      t("subtitle.newTrackName", { number: 1 }),
    );
  };

  const {
    isDragActive: isSubtitleDragActive,
    panelProps: baseSubtitleDropHandlers,
  } = useDroppablePanel<HTMLDivElement>({
    acceptFile: (file: File) => allowSubtitleDrop && isSubtitleFile(file),
    onDropFile: loadSubtitleFile,
  });

  const subtitleDropHandlers = {
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      if (!allowSubtitleDrop) {
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "none";
        }
        return;
      }
      baseSubtitleDropHandlers.onDragEnter(event);
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      baseSubtitleDropHandlers.onDragLeave(event);
    },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!allowSubtitleDrop) {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "none";
        }
        return;
      }
      baseSubtitleDropHandlers.onDragOver(event);
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      if (!allowSubtitleDrop) {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "none";
        }
        return;
      }
      baseSubtitleDropHandlers.onDrop(event);
    },
  };

  const { isDragActive: isMediaDragActive, panelProps: mediaDropHandlers } =
    useDroppablePanel<HTMLDivElement>({
      acceptFile: isMediaFile,
      onDropFile: loadMediaFile,
    });

  useSubtitleShortcuts({
    subtitles,
    playbackTime,
    setIsPlaying,
    setEditingSubtitleUuid,
    tracks,
    activeTrackId: activeTrackId ?? null,
    setActiveTrackId,
    canUndoSubtitles,
    canRedoSubtitles,
    undoSubtitles,
    redoSubtitles,
  });

  // --- Old Subtitle Modification Callbacks Removed ---
  // Actions are now handled by context provider and consumed directly by child components

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (canUndoSubtitles) {
        event.preventDefault();
        // Setting returnValue is required for most modern browsers
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [canUndoSubtitles]);

  // Effect to handle pending scroll-to-subtitle
  useEffect(() => {
    if (pendingScrollToUuid && subtitleListRef.current) {
      // Function to attempt scroll with retry logic
      const attemptScroll = (retries = 0) => {
        const subtitleElement = document.getElementById(
          `subtitle-${pendingScrollToUuid}`,
        );
        if (subtitleElement) {
          // Element found, use requestAnimationFrame to ensure layout has settled
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const ok = subtitleListRef.current?.scrollToSubtitle(
                pendingScrollToUuid,
                {
                  instant: pendingScrollInstant,
                  center: true,
                  focus: pendingScrollInstant,
                },
              );
              if (ok) {
                // The subtitle will be highlighted naturally by the existing playback time logic
                setPendingScrollToUuid(null);
                setPendingScrollInstant(false);
              } else if (retries < 10) {
                setTimeout(() => attemptScroll(retries + 1), 50);
              } else {
                console.warn(
                  "Could not center subtitle after retries:",
                  pendingScrollToUuid,
                );
                setPendingScrollToUuid(null);
                setPendingScrollInstant(false);
              }
            });
          });
        } else if (retries < 10) {
          // Element not found yet, retry after a short delay
          setTimeout(() => attemptScroll(retries + 1), 50);
        } else {
          // Max retries reached, give up
          console.warn(
            "Could not find subtitle element after retries:",
            pendingScrollToUuid,
          );
          setPendingScrollToUuid(null);
          setPendingScrollInstant(false);
        }
      };

      // Start the retry process
      attemptScroll();
    }
  }, [pendingScrollToUuid, pendingScrollInstant]);

  useEffect(() => {
    if (tracks.length === 0) {
      setIsBulkOffsetOpen(false);
    }
  }, [tracks.length]);

  useEffect(() => {
    if (bulkOffsetDisabled && isBulkOffsetOpen) {
      setIsBulkOffsetOpen(false);
    }
  }, [bulkOffsetDisabled, isBulkOffsetOpen]);

  return (
    <div className="flex flex-col h-screen">
      <SkipLinks />
      <AppHeader
        canUndo={canUndoSubtitles}
        canRedo={canRedoSubtitles}
        onUndo={undoSubtitles}
        onRedo={redoSubtitles}
        mediaFileInputRef={mediaFileInputRef}
        onSelectMediaFile={loadMediaFile}
        mediaFileName={mediaFileName}
        isBulkOffsetOpen={isBulkOffsetOpen}
        onToggleBulkOffset={() => setIsBulkOffsetOpen((previous) => !previous)}
        bulkOffsetDisabled={bulkOffsetDisabled}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top section - Split panels */}
        <div className="flex h-[64vh]">
          {/* Left panel - Subtitle list */}
          <div
            className={cn(
              "relative w-1/2 transition-colors",
              isSubtitleDragActive && allowSubtitleDrop && "bg-yellow-50",
            )}
            {...subtitleDropHandlers}
          >
            <div
              className={cn(
                "h-full transition",
                isBulkOffsetOpen && "pointer-events-none blur-[1px] opacity-40",
              )}
            >
              <TrackTabs
                tracks={tracks}
                activeTrackId={activeTrackId}
                setActiveTrackId={setActiveTrackId}
                subtitleListRef={subtitleListRef}
                playbackTime={playbackTime}
                isPlaying={isPlaying}
                resumePlayback={resumeMediaPlayback}
                setIsPlaying={setIsPlaying}
                setPlaybackTime={setPlaybackTime}
                editingSubtitleUuid={editingSubtitleUuid}
                setEditingSubtitleUuid={setEditingSubtitleUuid}
                onScrollToRegion={(uuid) => {
                  if (waveformRef.current) {
                    waveformRef.current.scrollToRegion(uuid);
                  }
                }}
                onTimeJump={(seconds) =>
                  setPlaybackTime(
                    Math.min(duration, Math.max(0, playbackTime + seconds)),
                  )
                }
                jumpDuration={jumpDuration}
                onLoadSubtitleFile={loadSubtitleFile}
                onStartFromScratch={handleStartFromScratch}
              />
            </div>

            {isBulkOffsetOpen && tracks.length > 0 && (
              <BulkOffsetDrawer
                isOpen={isBulkOffsetOpen}
                subtitles={activeTrackSubtitles}
                trackIndex={activeTrackIndex}
                currentTrackName={activeTrack?.name ?? null}
                onPreviewChange={setBulkOffsetPreview}
                onApplyOffset={(selection, offsetSeconds, target) => {
                  bulkShiftSubtitlesAction(selection, offsetSeconds, target);
                }}
              />
            )}
          </div>

          {/* Right panel - Media player */}
          <div
            className={cn(
              "w-1/2 border-l-2 border-black dark:border-white transition-colors",
              isMediaDragActive && "bg-blue-50",
            )}
            {...mediaDropHandlers}
          >
            {/* VideoPlayer will get subtitles from context */}
            <VideoPlayer
              ref={videoPlayerRef}
              mediaFile={mediaFile}
              setMediaFile={setMediaFile}
              setMediaFileName={setMediaFileName}
              onProgress={(time) => {
                setPlaybackTime(time);
                waveformRef.current?.setWaveformTime(time);
              }}
              onPlayPause={(playing) => setIsPlaying(playing)}
              onDuration={(duration) => setDuration(duration)}
              seekTime={playbackTime}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
            />
          </div>
        </div>

        {/* Bottom section - Waveform */}
        <div className="h-[21vh]">
          {/* Custom Controls */}

          {mediaFile ? (
            <>
              <CustomControls
                isPlaying={isPlaying}
                playbackTime={playbackTime}
                duration={duration}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onTimeJump={(seconds) =>
                  setPlaybackTime(
                    Math.min(duration, Math.max(0, playbackTime + seconds)),
                  )
                }
                jumpDuration={jumpDuration}
                onChangeJumpDuration={(seconds) =>
                  setJumpDuration(Number.parseInt(seconds))
                }
                onSeek={(time) => setPlaybackTime(time)}
                playbackRate={playbackRate}
                onChangePlaybackRate={(rate) =>
                  setPlaybackRate(Number.parseFloat(rate))
                }
              />
              <WaveformVisualizer
                ref={waveformRef}
                mediaFile={mediaFile}
                isPlaying={isPlaying}
                onSeek={setPlaybackTime}
                onPlayPause={setIsPlaying}
                previewOffsets={bulkOffsetPreview}
                onRegionClick={(uuid, opts) => {
                  // Set pending scroll to be handled after track switch completes
                  setPendingScrollToUuid(uuid);
                  // If cross-track, use instant scroll and focus; otherwise keep smooth animation
                  setPendingScrollInstant(Boolean(opts?.crossTrack));
                }}
                // Subtitle action props removed (will use context)
              />
            </>
          ) : (
            <BottomInstructions />
          )}
        </div>
      </div>
    </div>
  );
}

// Default export wraps MainContent with the provider
export default function Home() {
  return (
    <SubtitleProvider>
      <MainContent />
    </SubtitleProvider>
  );
}
