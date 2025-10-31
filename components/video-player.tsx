"use client";

import {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactPlayer from "react-player";
import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { srtToVtt, subtitlesToSrtString } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useTranslations } from "next-intl";

export interface VideoPlayerProps {
  mediaFile: File | null;
  setMediaFile: (file: File | null) => void;
  setMediaFileName: (name: string) => void;
  onProgress: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onDuration: (duration: number) => void;
  seekTime: number;
  isPlaying: boolean;
  playbackRate: number;
}

export interface VideoPlayerHandle {
  resumePlayback: () => void;
}

const VideoPlayer = forwardRef(function VideoPlayer(
  {
    mediaFile,
    setMediaFile,
    setMediaFileName,
    onProgress,
    onPlayPause,
    onDuration,
    seekTime,
    isPlaying,
    playbackRate,
  }: VideoPlayerProps,
  ref: ForwardedRef<VideoPlayerHandle>,
) {
  const t = useTranslations();
  // Get subtitles from context
  const { subtitles } = useSubtitleContext();

  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [vttUrl, setVttUrl] = useState<string | null>(null);
  const playerRef = useRef<ReactPlayer>(null);
  const timeToRestore = useRef<number | null>(null); // Ref to store time before remount

  const lastPlayStateChange = useRef<number>(0);
  const DEBOUNCE_TIME = 200; // 200ms debounce

  const resumePlayback = useCallback(() => {
    const playerInstance = playerRef.current;
    if (!playerInstance) return;

    const internalPlayer = playerInstance.getInternalPlayer?.();
    if (!internalPlayer) return;

    const mediaElement =
      typeof (internalPlayer as HTMLMediaElement).play === "function"
        ? (internalPlayer as HTMLMediaElement)
        : null;

    if (!mediaElement) return;

    try {
      const playPromise = mediaElement.play();
      if (
        playPromise &&
        typeof (playPromise as Promise<void>).catch === "function"
      ) {
        (playPromise as Promise<void>).catch((error) => {
          if (
            error &&
            typeof error === "object" &&
            "name" in error &&
            (error as { name?: string }).name === "AbortError"
          ) {
            return;
          }
          console.warn("Failed to resume media playback:", error);
        });
      }
    } catch (error) {
      console.warn("Failed to resume media playback:", error);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    resumePlayback,
  }));

  useEffect(() => {
    if (playerRef.current && typeof seekTime === "number") {
      const player = playerRef.current;
      const currentTime = player.getCurrentTime();
      if (Math.abs(currentTime - seekTime) > 0.5) {
        player.seekTo(seekTime, "seconds");
        timeToRestore.current = seekTime;
      }
    }
  }, [seekTime]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Handle play/pause with debounce
  useEffect(() => {
    const now = Date.now();
    if (now - lastPlayStateChange.current < DEBOUNCE_TIME) {
      return; // Ignore rapid changes
    }
    lastPlayStateChange.current = now;
  }, [isPlaying]);

  useEffect(() => {
    if (!mediaFile) {
      setMediaUrl("");
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setMediaUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  useEffect(() => {
    if (!mediaUrl) {
      setVttUrl(null);
      return;
    }

    const srtString = subtitlesToSrtString(subtitles);
    const vttString = srtToVtt(srtString);
    const dataUrl = `data:text/vtt;charset=utf-8,${encodeURIComponent(
      vttString,
    )}`;

    if (playerRef.current) {
      timeToRestore.current = playerRef.current.getCurrentTime();
    }

    setVttUrl(dataUrl);
  }, [subtitles, mediaUrl]);

  if (!mediaUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Label className="cursor-pointer text-xl hover:text-blue-500 underline">
          {t("videoPlayer.loadFile")}
          <Input
            className="hidden"
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setMediaFile(file);
              setMediaFileName(file.name);
            }}
          />
        </Label>
        <div className="my-4 space-y-1 text-base">
          <p className="font-medium">{t("videoPlayer.supportedFormats")}</p>
          <p>
            <span className="font-semibold">
              {t("videoPlayer.supportedFormatsAudio")}:
            </span>{" "}
            <code>mp3</code>, <code>m4a</code>, <code>aac</code>,{" "}
            <code>wav</code>, <code>oga</code>, <code>weba</code>,{" "}
            <code>spx</code>
          </p>
          <p>
            <span className="font-semibold">
              {t("videoPlayer.supportedFormatsVideo")}:
            </span>{" "}
            <code>mp4</code>, <code>mov</code>, <code>webm</code>,{" "}
            <code>ogg</code>, <code>m4v</code>
          </p>
          <p>
            <span className="font-semibold">
              {t("videoPlayer.supportedFormatsStreams")}:
            </span>{" "}
            <code>HLS (.m3u8)</code>, <code>MPEG-DASH (.mpd)</code>,{" "}
            <code>FLV (.flv)</code>
          </p>
          <p className="text-muted-foreground whitespace-pre-line">
            {t("videoPlayer.supportedFormatsNote")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <ReactPlayer
        key={vttUrl ?? "no-subs"} // Remount when subtitle URL changes
        ref={playerRef}
        url={mediaUrl}
        width="100%"
        height="100%"
        progressInterval={100}
        onProgress={(state) => {
          const player = playerRef.current?.getInternalPlayer();
          if (player && !player.seeking) {
            onProgress(state.playedSeconds);
          }
        }}
        onSeeked={() => {
          // sometimes player.seeking is still true when onProgress is called, so this makes sure we update the waveform visualizer when seeking is done
          if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            onProgress(currentTime);
          }
        }}
        onPlay={() => onPlayPause(true)}
        onPause={() => onPlayPause(false)}
        onDuration={onDuration}
        // Restore time using onReady after remount
        onReady={(player) => {
          playerRef.current = player; // Ensure ref is set
          if (timeToRestore.current !== null) {
            player.seekTo(timeToRestore.current, "seconds");
            timeToRestore.current = null; // Reset after restoring
          }
        }}
        playing={isPlaying}
        playbackRate={playbackRate}
        config={{
          file: {
            forceVideo: false, // Do not force video
            attributes: {
              controlsList: "nodownload",
              playsInline: true,
            },
            tracks: vttUrl
              ? [
                  {
                    label: t("videoPlayer.subtitles"),
                    kind: "subtitles",
                    src: vttUrl, // in-memory URL to the track
                    srcLang: "unknown",
                    default: true,
                  },
                ]
              : [],
          },
        }}
      />
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
