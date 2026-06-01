"use client";

import { useCallback, useRef, useState } from "react";

export const useMediaFile = (defaultMediaFileName: string) => {
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaFileName, setMediaFileName] =
    useState<string>(defaultMediaFileName);

  const loadMediaFile = useCallback((file: File) => {
    setMediaFile(null);
    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = "";
    }
    // Force a remount so selecting the same media file resets the object URL.
    setTimeout(() => {
      setMediaFile(file);
      setMediaFileName(file.name);
    }, 0);
  }, []);

  return {
    mediaFile,
    setMediaFile,
    mediaFileName,
    setMediaFileName,
    mediaFileInputRef,
    loadMediaFile,
  };
};
