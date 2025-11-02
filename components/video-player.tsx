"use client";

import {
  type ForwardedRef,
  type SyntheticEvent,
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
  const playerRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const vttObjectUrlRef = useRef<string | null>(null);
  const setPlayerRef = useCallback((element: HTMLVideoElement | null) => {
    playerRef.current = element;
  }, []);
  const timeToRestore = useRef<number | null>(null); // Ref to store time before remount

  const lastPlayStateChange = useRef<number>(0);
  const DEBOUNCE_TIME = 200; // 200ms debounce

  const resumePlayback = useCallback(() => {
    const playerInstance = playerRef.current;
    if (!playerInstance) return;

    try {
      const playPromise = playerInstance.play?.();
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
      const currentTime = player.currentTime ?? 0;
      if (Math.abs(currentTime - seekTime) > 0.5) {
        player.currentTime = seekTime;
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
      if (vttObjectUrlRef.current) {
        URL.revokeObjectURL(vttObjectUrlRef.current);
        vttObjectUrlRef.current = null;
      }
      return;
    }

    const srtString = subtitlesToSrtString(subtitles);
    const vttString = srtToVtt(srtString);
    const blob = new Blob([vttString], { type: "text/vtt" });
    const objectUrl = URL.createObjectURL(blob);

    if (playerRef.current) {
      timeToRestore.current = playerRef.current.currentTime ?? null;
    }

    if (vttObjectUrlRef.current) {
      URL.revokeObjectURL(vttObjectUrlRef.current);
    }

    vttObjectUrlRef.current = objectUrl;
    setVttUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
      if (vttObjectUrlRef.current === objectUrl) {
        vttObjectUrlRef.current = null;
      }
    };
  }, [subtitles, mediaUrl]);

  const handleLoadedMetadata = useCallback(
    (event: SyntheticEvent<HTMLMediaElement>) => {
      playerRef.current = event.currentTarget;
      if (timeToRestore.current !== null) {
        event.currentTarget.currentTime = timeToRestore.current;
        timeToRestore.current = null;
      }
    },
    [],
  );

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
        ref={setPlayerRef}
        src={mediaUrl}
        width="100%"
        height="100%"
        playsInline
        controlsList="nodownload"
        onTimeUpdate={(event) => {
          const player = event.currentTarget;
          if (!player.seeking) {
            onProgress(player.currentTime);
          }
        }}
        onSeeked={(event) => {
          // sometimes player.seeking is still true when onProgress is called, so this makes sure we update the waveform visualizer when seeking is done
          onProgress(event.currentTarget.currentTime);
        }}
        onPlay={() => onPlayPause(true)}
        onPause={() => onPlayPause(false)}
        onDurationChange={(event) => onDuration(event.currentTarget.duration)}
        onLoadedMetadata={handleLoadedMetadata}
        onLoadedData={handleLoadedMetadata}
        playing={isPlaying}
        playbackRate={playbackRate}
      >
        {vttUrl ? (
          <track
            kind="subtitles"
            src={vttUrl}
            label={t("videoPlayer.subtitles")}
            srcLang="unknown"
            default
          />
        ) : null}
      </ReactPlayer>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
