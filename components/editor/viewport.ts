const CSS_PX_PER_REM = 16;

export const NARROW_SCREEN_PROCEED_SESSION_KEY =
  "subtitle-editor:narrow-screen-proceed";
export const EDITOR_MIN_WIDTH_REM = 64;
export const EDITOR_MIN_WIDTH_PX = EDITOR_MIN_WIDTH_REM * CSS_PX_PER_REM;
export const EDITOR_WIDE_VIEWPORT_QUERY = `(min-width: ${EDITOR_MIN_WIDTH_REM}rem)`;

export interface EditorViewportState {
  isWide: boolean;
  hasNarrowScreenProceed: boolean;
  shouldMountEditor: boolean;
}

export type MatchMediaLike = Pick<Window, "matchMedia">;
type SessionStorageLike = Pick<Storage, "getItem" | "setItem">;

export function createEditorViewportState(
  isWide: boolean,
  hasNarrowScreenProceed: boolean,
  hasMountedEditor = false,
): EditorViewportState {
  return {
    isWide,
    hasNarrowScreenProceed,
    shouldMountEditor: hasMountedEditor || isWide || hasNarrowScreenProceed,
  };
}

export const INITIAL_EDITOR_VIEWPORT_STATE = createEditorViewportState(
  false,
  false,
);

export function isWideEditorViewport(win: MatchMediaLike | undefined): boolean {
  return Boolean(win?.matchMedia(EDITOR_WIDE_VIEWPORT_QUERY).matches);
}

export function nextEditorViewportState(
  current: EditorViewportState,
  nextIsWide: boolean,
): EditorViewportState {
  return createEditorViewportState(
    nextIsWide,
    current.hasNarrowScreenProceed,
    current.shouldMountEditor,
  );
}

export function readNarrowScreenProceed(
  storage: SessionStorageLike | undefined,
): boolean {
  try {
    return storage?.getItem(NARROW_SCREEN_PROCEED_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistNarrowScreenProceed(
  storage: SessionStorageLike | undefined,
) {
  try {
    storage?.setItem(NARROW_SCREEN_PROCEED_SESSION_KEY, "true");
  } catch {
    // Browsers can disable sessionStorage; proceeding still works in memory.
  }
}
