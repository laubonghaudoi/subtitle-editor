"use client";

import { SubtitleList } from "@/components/subtitle-list";
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
import { VideoPlayer } from "@/components/video-player";
import { parseSRT } from "@/lib/srtParser";
import {
  addSubtitle,
  deleteSubtitle,
  mergeSubtitles,
  splitSubtitle,
  updateSubtitle,
  updateSubtitleEndTime,
  updateSubtitleStartTime,
} from "@/lib/subtitleOperations";
import type { Subtitle } from "@/types/subtitle";
import {
  DownloadIcon,
  QuestionMarkCircledIcon,
  VideoIcon,
} from "@radix-ui/react-icons";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconBadgeCc, IconSearch } from "@tabler/icons-react";
import { FindReplace } from "@/components/find-replace";
import { CustomControls } from "@/components/custom-controls";

const WaveformVisualizer = dynamic(
  () => import("@/components/waveform-visualizer"),
  {
    ssr: false, // Disable server-side rendering
  }
);

interface WaveformRef {
  scrollToRegion: (id: number) => void;
}

export default function Home() {
  const waveformRef = useRef<WaveformRef>(null);

  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [srtFileName, setSrtFileName] = useState<string>("subtitles.srt");
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingSrtFile, setPendingSrtFile] = useState<File | null>(null);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string>("Load media");

  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleFileUpload = async (file: File) => {
    setSrtFileName(file.name);
    const text = await file.text();
    const parsedSubtitles = parseSRT(text);
    setSubtitles(parsedSubtitles);
  };

  const handleSrtFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (subtitles.length > 0) {
      setPendingSrtFile(file);
      setShowOverwriteDialog(true);
    } else {
      await handleFileUpload(file);
    }
  };

  const downloadSRT = () => {
    if (subtitles.length === 0) return;

    const srtContent = subtitles
      .sort((a, b) => a.id - b.id)
      .map((subtitle) => {
        return `${subtitle.id}\n${subtitle.startTime} --> ${subtitle.endTime}\n${subtitle.text}\n`;
      })
      .join("\n");

    const blob = new Blob([srtContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = srtFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Use useCallback to memoize onDeleteSubtitle
  const onDeleteSubtitle = useCallback((id: number) => {
    setSubtitles((prevSubtitles) => deleteSubtitle(prevSubtitles, id));
  }, []);

  const handleSplitSubtitle = (
    id: number,
    caretPos: number,
    textLength: number
  ) => {
    setSubtitles((prev) => {
      return splitSubtitle(prev, id, caretPos, textLength);
    });
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (subtitles.length > 0) {
        event.preventDefault();
        // Setting returnValue is required for most modern browsers
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [subtitles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the focused element is a textarea
      if (document.activeElement?.tagName === "TEXTAREA") return;

      if (event.code === "Space") {
        event.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col h-screen">
      <nav className="h-[6vh] border-black border-b-2 flex items-center px-12 justify-between">
        <h1 className="text-lg font-semibold">Subtitle Editor</h1>
        <div className="flex gap-4 items-center">
          <Link href="/faq" target="_blank">
            <Button variant="ghost">
              <QuestionMarkCircledIcon />
            </Button>
          </Link>
          <FindReplace subtitles={subtitles} setSubtitles={setSubtitles} />

          <Label className="cursor-pointer">
            <Input
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
              id="media-file-input"
            />
            <Button
              variant="secondary"
              onClick={() => {
                document.getElementById("media-file-input")?.click();
              }}
              className="bg-cyan-300 hover:bg-cyan-500 hover:text-white text-black rounded-sm"
            >
              <VideoIcon />
              <span className="max-w-36 flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left">
                {mediaFileName}
              </span>
            </Button>
          </Label>
          <Label className="cursor-pointer">
            <Input
              type="file"
              className="hidden"
              accept=".srt"
              onChange={handleSrtFileSelect}
              id="srt-file-input"
            />
            <Button
              variant="secondary"
              onClick={() => {
                document.getElementById("srt-file-input")?.click();
              }}
              className="hover:bg-amber-500 hover:text-white bg-amber-300 text-black rounded-sm"
            >
              <IconBadgeCc />
              Load SRT
            </Button>
          </Label>

          <Button onClick={downloadSRT} disabled={subtitles.length === 0}>
            <DownloadIcon />
            Save SRT
          </Button>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top section - Split panels */}
        <div className="flex h-[64vh]">
          {/* Left panel - Subtitle list */}
          <div className="w-1/2">
            <div className="h-full">
              {subtitles.length > 0 ? (
                <SubtitleList
                  subtitles={subtitles}
                  currentTime={playbackTime}
                  onScrollToRegion={(id) => {
                    if (waveformRef.current) {
                      waveformRef.current.scrollToRegion(id);
                    }
                  }}
                  onUpdateSubtitleStartTime={(id: number, newTime: string) => {
                    setSubtitles(updateSubtitleStartTime(id, newTime));
                  }}
                  onUpdateSubtitleEndTime={(id: number, newTime: string) => {
                    setSubtitles(updateSubtitleEndTime(id, newTime));
                  }}
                  onUpdateSubtitle={(id: number, newText: string) => {
                    setSubtitles(updateSubtitle(subtitles, id, newText));
                  }}
                  onMergeSubtitles={(id1: number, id2: number) => {
                    setSubtitles(mergeSubtitles(subtitles, id1, id2));
                  }}
                  onAddSubtitle={(beforeId: number, afterId: number | null) => {
                    setSubtitles(addSubtitle(subtitles, beforeId, afterId));
                  }}
                  onDeleteSubtitle={(id: number) => {
                    setSubtitles(deleteSubtitle(subtitles, id));
                  }}
                  onSplitSubtitle={handleSplitSubtitle}
                  setIsPlaying={setIsPlaying}
                  setPlaybackTime={setPlaybackTime}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-sm">
                  <Label className="cursor-pointer text-xl hover:text-blue-500 underline">
                    Upload an SRT file
                    <Input
                      type="file"
                      className="hidden"
                      accept=".srt"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await handleFileUpload(file);
                      }}
                    />
                  </Label>
                  <p className="text-xl my-4">Or</p>
                  <button
                    type="button"
                    onClick={() =>
                      setSubtitles([
                        {
                          id: 1,
                          startTime: "00:00:00,000",
                          endTime: "00:00:03,000",
                          text: "New subtitle",
                        },
                      ])
                    }
                    className="cursor-pointer text-xl text-muted-foreground underline hover:text-blue-500"
                  >
                    Start from scratch
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Media player */}
          <div className="w-1/2 border-l-2 border-black">
            <VideoPlayer
              mediaFile={mediaFile}
              subtitles={subtitles}
              setMediaFile={setMediaFile}
              setMediaFileName={setMediaFileName}
              onProgress={(time) => setPlaybackTime(time)}
              onPlayPause={(playing) => setIsPlaying(playing)}
              onDuration={(duration) => setDuration(duration)}
              seekTime={playbackTime}
              isPlaying={isPlaying}
              playbackRate={playbackRate}
            />
          </div>
        </div>

        {/* Bottom section - Waveform */}
        <div className="h-[20vh]">
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
                currentTime={playbackTime}
                isPlaying={isPlaying}
                subtitles={subtitles}
                onSeek={setPlaybackTime}
                onPlayPause={setIsPlaying}
                onUpdateSubtitleTiming={(id, startTime, endTime) => {
                  setSubtitles((subs) =>
                    subs.map((sub) =>
                      sub.id === id ? { ...sub, startTime, endTime } : sub
                    )
                  );
                }}
                onUpdateSubtitleText={(id: number, newText: string) => {
                  setSubtitles(updateSubtitle(subtitles, id, newText));
                }}
                onDeleteSubtitle={onDeleteSubtitle}
              />
            </>
          ) : (
            <div className="flex flex-col items-left text-lg  h-full text-gray-600 px-8 py-4 border-t-2 border-black">
              <p className="my-4">After loading the media and subtitles:</p>
              <ul className="list-disc list-inside">
                <li>Click the subtitle text or time stamps to edit.</li>
                <li>
                  When editing a subtitle text, press <kbd>shift</kbd> +{" "}
                  <kbd>enter</kbd> to split the subtitle into two.
                </li>
                <li>Click the icons to add, merge or delete subtitles.</li>
                <li>
                  Drag the dashed borders on the waveform to change the
                  subtitles' time stamps.
                </li>
                <li>
                  Remember to click "Save SRT" to save the subtitles after you
                  finish editing!
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* SRT ovverwrite alert dialog */}
        <AlertDialog
          open={showOverwriteDialog}
          onOpenChange={setShowOverwriteDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace existing subtitles?</AlertDialogTitle>
              <AlertDialogDescription>
                Loading a new SRT file will replace the current subtitles. Make
                sure you have downloaded the current SRT first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingSrtFile(null)}>
                Cancel
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
                Yes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
