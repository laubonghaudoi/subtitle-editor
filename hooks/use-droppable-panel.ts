"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DragEvent, DragEventHandler } from "react";

interface UseDroppablePanelOptions<T extends HTMLElement> {
  acceptFile: (file: File) => boolean;
  onDropFile: (file: File) => void | Promise<void>;
}

interface PanelHandlers<T extends HTMLElement> {
  onDragEnter: DragEventHandler<T>;
  onDragLeave: DragEventHandler<T>;
  onDragOver: DragEventHandler<T>;
  onDrop: DragEventHandler<T>;
}

export function useDroppablePanel<T extends HTMLElement = HTMLElement>({
  acceptFile,
  onDropFile,
}: UseDroppablePanelOptions<T>) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const hasFilesPayload = useCallback((event: DragEvent<T>) => {
    const types = event.dataTransfer?.types;
    if (!types) {
      return false;
    }
    return Array.from(types).includes("Files");
  }, []);

  const getMatchingFile = useCallback(
    (event: DragEvent<T>) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) {
        return null;
      }
      return Array.from(files).find(acceptFile) ?? null;
    },
    [acceptFile],
  );

  const handleDragOver: DragEventHandler<T> = useCallback(
    (event) => {
      if (hasFilesPayload(event)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    },
    [hasFilesPayload],
  );

  const handleDragEnter: DragEventHandler<T> = useCallback(
    (event) => {
      if (!hasFilesPayload(event)) {
        return;
      }
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsDragActive(true);
    },
    [hasFilesPayload],
  );

  const handleDragLeave: DragEventHandler<T> = useCallback((event) => {
    if (!hasFilesPayload(event)) {
      return;
    }
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }, [hasFilesPayload]);

  const handleDrop: DragEventHandler<T> = useCallback(
    async (event) => {
      if (!hasFilesPayload(event)) {
        return;
      }
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragActive(false);
      const file = getMatchingFile(event);
      if (!file) {
        return;
      }
      await onDropFile(file);
    },
    [getMatchingFile, hasFilesPayload, onDropFile],
  );

  const panelProps = useMemo<PanelHandlers<T>>(
    () => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop],
  );

  return { isDragActive, panelProps };
}
