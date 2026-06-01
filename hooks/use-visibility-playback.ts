"use client";

import { useCallback, useEffect } from "react";
import type { RefObject } from "react";

interface VisibilityPlaybackOptions {
  onHide: () => void;
  onShow: () => void;
}

interface ResumablePlaybackHandle {
  resumePlayback: () => void;
}

interface PlaybackVisibilityCoordinatorOptions {
  playInBackground: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  videoPlayerRef: RefObject<ResumablePlaybackHandle | null>;
  waveformRef: RefObject<ResumablePlaybackHandle | null>;
}

export const shouldIgnorePauseWhileHidden = (playInBackground: boolean) =>
  playInBackground && typeof document !== "undefined" && document.hidden;

export const useVisibilityPlayback = ({
  onHide,
  onShow,
}: VisibilityPlaybackOptions) => {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onHide();
      } else {
        onShow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onHide, onShow]);
};

export const usePlaybackVisibilityCoordinator = ({
  playInBackground,
  isPlaying,
  setIsPlaying,
  videoPlayerRef,
  waveformRef,
}: PlaybackVisibilityCoordinatorOptions) => {
  const handleHide = useCallback(() => {
    if (!playInBackground) {
      setIsPlaying(false);
    }
  }, [playInBackground, setIsPlaying]);

  const handleShow = useCallback(() => {
    if (playInBackground && isPlaying) {
      videoPlayerRef.current?.resumePlayback();
      waveformRef.current?.resumePlayback();
    }
  }, [isPlaying, playInBackground, videoPlayerRef, waveformRef]);

  useVisibilityPlayback({
    onHide: handleHide,
    onShow: handleShow,
  });
};
