const CSS_PX_PER_REM = 16;

export const EDITOR_MIN_WIDTH_REM = 64;
export const EDITOR_MIN_WIDTH_PX = EDITOR_MIN_WIDTH_REM * CSS_PX_PER_REM;
export const EDITOR_WIDE_VIEWPORT_QUERY = `(min-width: ${EDITOR_MIN_WIDTH_PX}px)`;

export interface EditorViewportState {
  isWide: boolean;
  shouldMountEditor: boolean;
}

export const INITIAL_EDITOR_VIEWPORT_STATE: EditorViewportState = {
  isWide: false,
  shouldMountEditor: false,
};

export type MatchMediaLike = Pick<Window, "matchMedia">;

export function isWideEditorViewport(win: MatchMediaLike | undefined): boolean {
  return Boolean(win?.matchMedia(EDITOR_WIDE_VIEWPORT_QUERY).matches);
}

export function nextEditorViewportState(
  current: EditorViewportState,
  nextIsWide: boolean,
): EditorViewportState {
  return {
    isWide: nextIsWide,
    shouldMountEditor: current.shouldMountEditor || nextIsWide,
  };
}
