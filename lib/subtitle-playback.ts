export const CUE_PREVIEW_SEEK_OFFSET_SECONDS = 0.000001;

export function getCuePreviewSeekTime(
  startSeconds: number,
  endSeconds: number,
) {
  if (!Number.isFinite(startSeconds) || !Number.isFinite(endSeconds)) {
    return startSeconds;
  }

  const previewTime = startSeconds + CUE_PREVIEW_SEEK_OFFSET_SECONDS;
  return previewTime < endSeconds ? previewTime : startSeconds;
}
