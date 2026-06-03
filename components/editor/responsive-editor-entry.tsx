"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NarrowScreenNotice } from "./narrow-screen-notice";
import {
  createEditorViewportState,
  EDITOR_WIDE_VIEWPORT_QUERY,
  INITIAL_EDITOR_VIEWPORT_STATE,
  isWideEditorViewport,
  nextEditorViewportState,
  persistNarrowScreenProceed,
  readNarrowScreenProceed,
  type EditorViewportState,
} from "./viewport";

type EditorAppComponent = ComponentType;
type EditorLoader = () => Promise<{ default: EditorAppComponent }>;

interface NarrowScreenNoticeContent {
  eyebrow: string;
  title: string;
  description: string;
  minimum: string;
  faqHref: string;
  faqLabel: string;
  proceedLabel: string;
}

interface ResponsiveEditorEntryProps {
  loadingLabel: string;
  narrowScreenNotice: NarrowScreenNoticeContent;
  loadEditor?: EditorLoader;
}

const defaultEditorLoader: EditorLoader = () => import("./editor-app");

function getSessionStorage(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export default function ResponsiveEditorEntry({
  loadingLabel,
  narrowScreenNotice,
  loadEditor = defaultEditorLoader,
}: ResponsiveEditorEntryProps) {
  const hasRequestedEditorRef = useRef(false);
  const isMountedRef = useRef(true);
  const [viewportState, setViewportState] = useState<EditorViewportState>(
    INITIAL_EDITOR_VIEWPORT_STATE,
  );
  const [EditorApp, setEditorApp] = useState<EditorAppComponent | null>(null);

  const requestEditor = useCallback(() => {
    if (hasRequestedEditorRef.current) return;
    hasRequestedEditorRef.current = true;

    void loadEditor().then((module) => {
      if (isMountedRef.current) {
        setEditorApp(() => module.default);
      }
    });
  }, [loadEditor]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const hasStoredProceed = readNarrowScreenProceed(getSessionStorage());

    const updateViewport = () => {
      const nextIsWide = isWideEditorViewport(window);
      setViewportState((current) => {
        const currentWithStoredProceed = hasStoredProceed
          ? createEditorViewportState(
              current.isWide,
              true,
              current.shouldMountEditor,
            )
          : current;
        return nextEditorViewportState(currentWithStoredProceed, nextIsWide);
      });
      if (nextIsWide || hasStoredProceed) {
        requestEditor();
      }
    };

    const media = window.matchMedia(EDITOR_WIDE_VIEWPORT_QUERY);
    updateViewport();
    media.addEventListener("change", updateViewport);

    return () => {
      media.removeEventListener("change", updateViewport);
    };
  }, [requestEditor]);

  const handleProceed = () => {
    persistNarrowScreenProceed(getSessionStorage());
    setViewportState((current) =>
      createEditorViewportState(
        current.isWide,
        true,
        current.shouldMountEditor,
      ),
    );
    requestEditor();
  };

  const shouldShowNotice =
    !viewportState.isWide && !viewportState.hasNarrowScreenProceed;

  return (
    <>
      {shouldShowNotice ? (
        <NarrowScreenNotice {...narrowScreenNotice} onProceed={handleProceed} />
      ) : null}
      {viewportState.shouldMountEditor ? (
        EditorApp ? (
          <div hidden={shouldShowNotice} aria-hidden={shouldShowNotice}>
            <EditorApp />
          </div>
        ) : (
          <div
            hidden={shouldShowNotice}
            aria-hidden={shouldShowNotice}
            className="flex min-h-screen items-center justify-center text-sm text-slate-600 dark:text-slate-300"
          >
            {loadingLabel}
          </div>
        )
      ) : null}
    </>
  );
}
