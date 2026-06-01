"use client";

import { useCallback, useState } from "react";

export const usePlaybackState = () => {
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [jumpDuration, setJumpDuration] = useState(5);

  const jumpBy = useCallback(
    (seconds: number) => {
      setPlaybackTime((time) =>
        Math.min(duration, Math.max(0, time + seconds)),
      );
    },
    [duration],
  );

  return {
    playbackTime,
    setPlaybackTime,
    isPlaying,
    setIsPlaying,
    duration,
    setDuration,
    playbackRate,
    setPlaybackRate,
    jumpDuration,
    setJumpDuration,
    jumpBy,
  };
};
