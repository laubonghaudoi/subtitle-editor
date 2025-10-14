const mediaExtensionPattern =
  /\.(m4a|mp3|mp4|webm|ogg|wav|aac|flac|opus)$/i;

export function isSubtitleFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".srt") || name.endsWith(".vtt") || file.type === "text/vtt"
  );
}

export function isMediaFile(file: File) {
  if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
    return true;
  }
  return mediaExtensionPattern.test(file.name);
}
