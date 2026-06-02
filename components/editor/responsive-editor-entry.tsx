"use client";

import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import {
  EDITOR_WIDE_VIEWPORT_QUERY,
  INITIAL_EDITOR_VIEWPORT_STATE,
  isWideEditorViewport,
  nextEditorViewportState,
  type EditorViewportState,
} from "./viewport";

type EditorAppComponent = ComponentType;

interface ResponsiveEditorEntryProps {
  loadingLabel: string;
}

export default function ResponsiveEditorEntry({
  loadingLabel,
}: ResponsiveEditorEntryProps) {
  const hasRequestedEditorRef = useRef(false);
  const [viewportState, setViewportState] = useState<EditorViewportState>(
    INITIAL_EDITOR_VIEWPORT_STATE,
  );
  const [EditorApp, setEditorApp] = useState<EditorAppComponent | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEditor = () => {
      if (hasRequestedEditorRef.current) return;
      hasRequestedEditorRef.current = true;

      void import("./editor-app").then((module) => {
        if (!cancelled) {
          setEditorApp(() => module.default);
        }
      });
    };

    const updateViewport = () => {
      const nextIsWide = isWideEditorViewport(window);
      setViewportState((current) =>
        nextEditorViewportState(current, nextIsWide),
      );
      if (nextIsWide) {
        loadEditor();
      }
    };

    const media = window.matchMedia(EDITOR_WIDE_VIEWPORT_QUERY);
    updateViewport();
    media.addEventListener("change", updateViewport);

    return () => {
      cancelled = true;
      media.removeEventListener("change", updateViewport);
    };
  }, []);

  if (!viewportState.shouldMountEditor) {
    return null;
  }

  if (!EditorApp) {
    return (
      <div className="hidden min-h-screen items-center justify-center text-sm text-slate-600 dark:text-slate-300 editor:flex">
        {loadingLabel}
      </div>
    );
  }

  return (
    <div hidden={!viewportState.isWide} aria-hidden={!viewportState.isWide}>
      <EditorApp />
    </div>
  );
}
