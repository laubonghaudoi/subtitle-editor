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

export interface EditorAppProps {
  faqHref: string;
}

type EditorAppComponent = ComponentType<EditorAppProps>;
type EditorLoader = () => Promise<{ default: EditorAppComponent }>;

interface NarrowScreenNoticeContent {
  title: string;
  description: string;
  minimum: string;
  faqHref: string;
  faqLabel: string;
  proceedLabel: string;
}

interface ResponsiveEditorEntryProps {
  productTitle: string;
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
  productTitle,
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
    isMountedRef.current = true;
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
      {shouldShowNotice || !EditorApp ? (
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{productTitle}</h1>
            <a
              href={narrowScreenNotice.faqHref}
              className="hidden text-sm underline underline-offset-2 editor:inline"
            >
              {narrowScreenNotice.faqLabel}
            </a>
          </div>
          {shouldShowNotice ? (
            <NarrowScreenNotice
              {...narrowScreenNotice}
              onProceed={handleProceed}
            />
          ) : (
            <p role="status" className="mt-6 text-sm text-muted-foreground">
              {loadingLabel}
            </p>
          )}
        </div>
      ) : null}
      {viewportState.shouldMountEditor && EditorApp ? (
        <div hidden={shouldShowNotice} aria-hidden={shouldShowNotice}>
          <EditorApp faqHref={narrowScreenNotice.faqHref} />
        </div>
      ) : null}
    </>
  );
}
