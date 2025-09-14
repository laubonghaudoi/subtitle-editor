"use client"; // Ensure this is the very first line

import BottomInstructions from "@/components/bottom-instructions";
import CustomControls from "@/components/custom-controls";
import FindReplace from "@/components/find-replace";
import LanguageSwitcher from "@/components/language-switcher";
import LoadSrt from "@/components/load-srt";
import SaveSrt from "@/components/save-srt";
import SkipLinks from "@/components/skip-links";
import SubtitleList, { type SubtitleListRef } from "@/components/subtitle-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SubtitleProvider,
  useSubtitleContext,
} from "@/context/subtitle-context";
import { parseSRT, parseVTT, extractVttPrologue } from "@/lib/subtitleOperations";
import { timeToSeconds } from "@/lib/utils";
import {
  IconArrowBack,
  IconArrowForward,
  IconMovie,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const runtime = "edge";

const VideoPlayer = dynamic(() => import("@/components/video-player"), {
  ssr: false, // Disable server-side rendering
});

const WaveformVisualizer = dynamic(
  () => import("@/components/waveform-visualizer"),
  {
    ssr: false, // Disable server-side rendering
  }
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
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  // Get subtitle state and actions from context
  const {
    tracks,
    activeTrackId,
    setActiveTrackId,
    subtitles,
    setInitialSubtitles, // Use this instead of setSubtitlesWithHistory
    undoSubtitles,
    redoSubtitles,
    canUndoSubtitles,
    canRedoSubtitles,
    // Action functions are now available via context, no need for local handlers like handleUpdateSubtitleText etc.
  } = useSubtitleContext();

  // Keep page-specific state here
  // The overwrite dialog is not fully implemented with multi-track yet.
  // We'll keep the state for now and address it in a future step.
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingSrtFile, setPendingSrtFile] = useState<File | null>(null);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string>(
    t("buttons.loadMedia")
  );
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  // State to track which subtitle is being edited
  const [editingSubtitleUuid, setEditingSubtitleUuid] = useState<string | null>(
    null
  );

  // State to track pending scroll-to-region after track switch
  const [pendingScrollToUuid, setPendingScrollToUuid] = useState<string | null>(
    null
  );
  // Whether the pending scroll should be instant (used for cross-track clicks)
  const [pendingScrollInstant, setPendingScrollInstant] =
    useState<boolean>(false);

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
    const isVtt = file.name.toLowerCase().endsWith(".vtt") || /^WEBVTT( |$)/.test(firstLine);
    const parsedSubtitles = isVtt ? parseVTT(text) : parseSRT(text);
    // Preserve VTT prologue blocks (NOTE/STYLE/REGION) when loading VTT
    const meta = isVtt ? extractVttPrologue(text) : undefined;
    // Use the context action to set initial subtitles
    setInitialSubtitles(
      parsedSubtitles,
      file.name.replace(/\.(srt|vtt)$/i, ""),
      meta ? { vttHeader: meta.header, vttPrologue: meta.prologue } : undefined
    );
  };

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      // Check if the focused element is an input or textarea
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA"
      ) {
        return; // Allow spacebar default behavior in inputs/textareas
      }

      if (event.code === "Space") {
        event.preventDefault(); // Prevent default space behavior (like scrolling) elsewhere
        setIsPlaying(!isPlaying);
      } else if (event.key === "Tab") {
        event.preventDefault(); // Prevent default tab behavior (focus switching)

        // Find the subtitle currently playing
        const currentSubtitle = subtitles.find((sub) => {
          // Convert SRT time strings to seconds using the original util function
          const startTimeSeconds = timeToSeconds(sub.startTime);
          const endTimeSeconds = timeToSeconds(sub.endTime);
          return (
            playbackTime >= startTimeSeconds && playbackTime < endTimeSeconds
          );
        });

        if (currentSubtitle) {
          setEditingSubtitleUuid(currentSubtitle.uuid); // Set the UUID of the subtitle to edit
          // Optionally, scroll the list to the editing item if needed
          // This might require passing a ref or callback to SubtitleList
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // Dependencies now include subtitles and playbackTime for finding the current subtitle
  }, [isPlaying, subtitles, playbackTime]); // Removed setEditingSubtitleUuid

  // Track switching shortcuts: Alt + 1..4
  useEffect(() => {
    const handleTrackSwitch = (event: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas/contenteditable
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (!event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }

      // Support both event.key ('1'..'4') and event.code ('Digit1'..'Digit4')
      let index = -1;
      if (event.code.startsWith("Digit")) {
        const n = Number.parseInt(event.code.replace("Digit", ""), 10);
        if (n >= 1 && n <= 4) index = n - 1;
      } else if (event.key >= "1" && event.key <= "4") {
        index = Number.parseInt(event.key, 10) - 1;
      }

      if (index >= 0 && index < tracks.length) {
        event.preventDefault();
        const targetTrack = tracks[index];
        if (targetTrack && targetTrack.id !== activeTrackId) {
          setActiveTrackId(targetTrack.id);
        }
      }
    };

    window.addEventListener("keydown", handleTrackSwitch);
    return () => window.removeEventListener("keydown", handleTrackSwitch);
  }, [tracks, activeTrackId, setActiveTrackId]);

  // Effect for Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleUndoRedo = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? event.metaKey : event.ctrlKey;

      // Check for Cmd/Ctrl + Z for Undo
      if (modKey && !event.shiftKey && event.key.toLowerCase() === "z") {
        // Prevent default browser/input undo behavior only if we can undo
        if (canUndoSubtitles) {
          event.preventDefault();
          undoSubtitles();
        }
      }
      // Check for Cmd/Ctrl + Shift + Z for Redo
      else if (modKey && event.shiftKey && event.key.toLowerCase() === "z") {
        // Prevent default browser redo behavior only if we can redo
        if (canRedoSubtitles) {
          event.preventDefault();
          redoSubtitles();
        }
      }
    };

    window.addEventListener("keydown", handleUndoRedo);
    return () => {
      window.removeEventListener("keydown", handleUndoRedo);
    };
    // Dependencies include the undo/redo functions and their possibility flags
  }, [undoSubtitles, redoSubtitles, canUndoSubtitles, canRedoSubtitles]);

  // Effect to handle pending scroll-to-subtitle
  useEffect(() => {
    if (pendingScrollToUuid && subtitleListRef.current) {
      // Function to attempt scroll with retry logic
      const attemptScroll = (retries = 0) => {
        const subtitleElement = document.getElementById(
          `subtitle-${pendingScrollToUuid}`
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
                }
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
                  pendingScrollToUuid
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
            pendingScrollToUuid
          );
          setPendingScrollToUuid(null);
          setPendingScrollInstant(false);
        }
      };

      // Start the retry process
      attemptScroll();
    }
  }, [pendingScrollToUuid, pendingScrollInstant]);

  return (
    <div className="flex flex-col h-screen">
      <SkipLinks />
      <nav className="h-[6vh] border-black border-b-2 flex items-center px-12 justify-between">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold mx-4">
            {t("navigation.title")}
          </h1>
          <LanguageSwitcher />
          <Link href="/faq" target="_blank" aria-label={t("navigation.faq")}>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              aria-label={t("navigation.faq")}
            >
              <IconQuestionMark size={20} />
            </Button>
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canUndoSubtitles}
                  onClick={undoSubtitles}
                  className="cursor-pointer"
                  aria-label={t("navigation.undo")}
                >
                  <IconArrowBack />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("navigation.undo")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!canRedoSubtitles}
                  onClick={redoSubtitles}
                  className="cursor-pointer"
                  aria-label={t("navigation.redo")}
                >
                  <IconArrowForward />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("navigation.redo")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* FindReplace will get subtitles & actions from context */}
          <FindReplace />

          <LoadSrt />

          <Label className="cursor-pointer">
            <Input
              ref={mediaFileInputRef}
              type="file"
              className="hidden"
              accept="audio/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setMediaFile(null); // Reset first to trigger a re-render
                setTimeout(() => {
                  setMediaFile(file);
                  setMediaFileName(file.name);
                }, 0);
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                mediaFileInputRef.current?.click();
              }}
              className="bg-cyan-300 hover:bg-cyan-500 hover:text-white text-black rounded-sm cursor-pointer"
            >
              <IconMovie size={20} />
              <span className="max-w-36 flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left">
                {mediaFileName}
              </span>
            </Button>
          </Label>

          <SaveSrt />
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top section - Split panels */}
        <div className="flex h-[64vh]">
          {/* Left panel - Subtitle list */}
          <div className="w-1/2">
            <div className="h-full">
              {tracks.length > 0 && activeTrackId ? (
                <Tabs
                  value={activeTrackId}
                  onValueChange={setActiveTrackId}
                  className="h-full flex flex-col"
                >
                  {tracks.length > 1 && (
                    <div className="w-full max-w-full overflow-x-auto">
                      <TabsList className="bg-white gap-4 border-b-1 border-dashed border-black rounded-none w-max flex-nowrap">
                        {tracks.map((track) => (
                          <TabsTrigger
                            key={track.id}
                            value={track.id}
                            className="flex-shrink-0 data-[state=active]:bg-black data-[state=active]:text-white rounded-xs"
                          >
                            {track.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                  )}
                  {tracks.map((track) => (
                    <TabsContent
                      key={track.id}
                      value={track.id}
                      className="flex-grow overflow-y-auto m-0"
                    >
                      <SubtitleList
                        ref={
                          activeTrackId === track.id
                            ? subtitleListRef
                            : undefined
                        }
                        // Pass only non-subtitle state/props
                        currentTime={playbackTime}
                        onScrollToRegion={(uuid) => {
                          if (waveformRef.current) {
                            waveformRef.current.scrollToRegion(uuid);
                          }
                        }}
                        setIsPlaying={setIsPlaying}
                        setPlaybackTime={setPlaybackTime}
                        editingSubtitleUuid={editingSubtitleUuid}
                        setEditingSubtitleUuid={setEditingSubtitleUuid}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-sm">
                  <Label className="cursor-pointer text-xl hover:text-blue-500 underline">
                    <span>{t("labels.loadSrtFile")}</span>
                    <Input
                      type="file"
                      className="hidden"
                      accept=".srt,.vtt"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await handleFileUpload(file);
                      }}
                    />
                  </Label>
                  <p className="text-xl my-4">{t("labels.or")}</p>
                  <Button
                    variant="link"
                    onClick={() =>
                      // Use the context action for starting from scratch
                      setInitialSubtitles(
                        [
                          {
                            uuid: uuidv4(), // Assign UUID
                            id: 1,
                            startTime: "00:00:00,000",
                            endTime: "00:00:03,000",
                            text: t("subtitle.newSubtitle"),
                          },
                        ],
                        t("subtitle.newTrackName", { number: 1 })
                      )
                    }
                    className="cursor-pointer text-xl text-muted-foreground underline hover:text-blue-500"
                  >
                    {t("labels.startFromScratch")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Media player */}
          <div className="w-1/2 border-l-2 border-black">
            {/* VideoPlayer will get subtitles from context */}
            <VideoPlayer
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
        <div className="h-[22vh]">
          {/* Custom Controls */}

          {mediaFile ? (
            <>
              <CustomControls
                isPlaying={isPlaying}
                playbackTime={playbackTime}
                duration={duration}
                onPlayPause={() => setIsPlaying(!isPlaying)}
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

        {/* SRT ovverwrite alert dialog */}
        <AlertDialog
          open={showOverwriteDialog}
          onOpenChange={setShowOverwriteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("dialog.discardTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("dialog.discardDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingSrtFile(null)}>
                {t("dialog.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-500"
                onClick={async () => {
                  if (pendingSrtFile) {
                    await handleFileUpload(pendingSrtFile);
                    setPendingSrtFile(null);
                  }
                  setShowOverwriteDialog(false);
                }}
              >
                {t("dialog.yes")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
