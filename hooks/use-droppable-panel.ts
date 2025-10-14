"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { DragEvent, DragEventHandler } from "react";

interface UseDroppablePanelOptions {
  acceptFile: (file: File) => boolean;
  onDropFile: (file: File) => void | Promise<void>;
}

interface PanelHandlers<TEl extends HTMLElement> {
  onDragEnter: DragEventHandler<TEl>;
  onDragLeave: DragEventHandler<TEl>;
  onDragOver: DragEventHandler<TEl>;
  onDrop: DragEventHandler<TEl>;
}

export function useDroppablePanel<TEl extends HTMLElement = HTMLElement>({
  acceptFile,
  onDropFile,
}: UseDroppablePanelOptions) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const hasFilesPayload = useCallback((event: DragEvent<TEl>) => {
    const types = event.dataTransfer?.types;
    if (!types) {
      return false;
    }
    return Array.from(types).includes("Files");
  }, []);

  const getMatchingFile = useCallback(
    (event: DragEvent<TEl>) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) {
        return null;
      }
      return Array.from(files).find(acceptFile) ?? null;
    },
    [acceptFile],
  );

  const handleDragOver: DragEventHandler<TEl> = useCallback(
    (event) => {
      if (hasFilesPayload(event)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    },
    [hasFilesPayload],
  );

  const handleDragEnter: DragEventHandler<TEl> = useCallback(
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

  const handleDragLeave: DragEventHandler<TEl> = useCallback((event) => {
    if (!hasFilesPayload(event)) {
      return;
    }
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }, [hasFilesPayload]);

  const handleDrop: DragEventHandler<TEl> = useCallback(
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

  const panelProps = useMemo<PanelHandlers<TEl>>(
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
