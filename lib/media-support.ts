export type MediaSupportLevel = "maybe" | "probably";

export interface MediaFormatSupport {
  label: string;
  support: MediaSupportLevel;
}

interface MediaFormatProbe {
  key: string;
  label: string;
  mimeType: string;
}

type CanPlayTypeFn = (mimeType: string) => string;

const SUPPORT_WEIGHT: Record<MediaSupportLevel, number> = {
  maybe: 1,
  probably: 2,
};

const AUDIO_FORMAT_PROBES: readonly MediaFormatProbe[] = [
  { key: "mp3", label: "mp3", mimeType: "audio/mpeg" },
  { key: "m4a-aac", label: "m4a / aac", mimeType: "audio/aac" },
  {
    key: "m4a-aac",
    label: "m4a / aac",
    mimeType: 'audio/mp4; codecs="mp4a.40.2"',
  },
  {
    key: "m4a-aac",
    label: "m4a / aac",
    mimeType: 'audio/x-m4a; codecs="mp4a.40.2"',
  },
  { key: "m4a-aac", label: "m4a / aac", mimeType: "audio/mp4" },
  { key: "wav", label: "wav", mimeType: "audio/wav" },
  { key: "wav", label: "wav", mimeType: "audio/wave" },
  { key: "flac", label: "flac", mimeType: "audio/flac" },
  { key: "flac", label: "flac", mimeType: "audio/x-flac" },
  { key: "ogg-oga", label: "ogg / oga", mimeType: 'audio/ogg; codecs="vorbis"' },
  { key: "ogg-oga", label: "ogg / oga", mimeType: "audio/ogg" },
  { key: "opus", label: "opus", mimeType: "audio/opus" },
  { key: "opus", label: "opus", mimeType: 'audio/ogg; codecs="opus"' },
  {
    key: "weba-webm",
    label: "weba / webm",
    mimeType: 'audio/webm; codecs="opus"',
  },
  {
    key: "weba-webm",
    label: "weba / webm",
    mimeType: 'audio/webm; codecs="vorbis"',
  },
  { key: "weba-webm", label: "weba / webm", mimeType: "audio/webm" },
];

const VIDEO_FORMAT_PROBES: readonly MediaFormatProbe[] = [
  {
    key: "mp4-m4v",
    label: "mp4 / m4v",
    mimeType: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
  },
  { key: "mp4-m4v", label: "mp4 / m4v", mimeType: "video/mp4" },
  {
    key: "webm",
    label: "webm",
    mimeType: 'video/webm; codecs="vp9, opus"',
  },
  {
    key: "webm",
    label: "webm",
    mimeType: 'video/webm; codecs="vp8, vorbis"',
  },
  { key: "webm", label: "webm", mimeType: "video/webm" },
  {
    key: "ogv-ogg",
    label: "ogv / ogg",
    mimeType: 'video/ogg; codecs="theora, vorbis"',
  },
  { key: "ogv-ogg", label: "ogv / ogg", mimeType: "video/ogg" },
  {
    key: "mov",
    label: "mov",
    mimeType: 'video/quicktime; codecs="avc1.42E01E, mp4a.40.2"',
  },
  {
    key: "mov",
    label: "mov",
    mimeType: "video/quicktime",
  },
  {
    key: "mkv",
    label: "mkv",
    mimeType: 'video/x-matroska; codecs="avc1.42E01E, mp4a.40.2"',
  },
  {
    key: "mkv",
    label: "mkv",
    mimeType: 'video/x-matroska; codecs="vp9, opus"',
  },
  { key: "mkv", label: "mkv", mimeType: "video/x-matroska" },
];

export interface BrowserMediaSupport {
  audio: MediaFormatSupport[];
  video: MediaFormatSupport[];
}

export function normalizeCanPlayType(
  value: string,
): MediaSupportLevel | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "maybe" || normalized === "probably") {
    return normalized;
  }
  return null;
}

export function detectSupportedFormats(
  probes: readonly MediaFormatProbe[],
  canPlayType: CanPlayTypeFn,
): MediaFormatSupport[] {
  const formats = new Map<
    string,
    { label: string; support: MediaSupportLevel; order: number }
  >();

  probes.forEach((probe, index) => {
    const support = normalizeCanPlayType(canPlayType(probe.mimeType));
    if (!support) return;

    const existing = formats.get(probe.key);
    if (!existing) {
      formats.set(probe.key, {
        label: probe.label,
        support,
        order: index,
      });
      return;
    }

    if (SUPPORT_WEIGHT[support] > SUPPORT_WEIGHT[existing.support]) {
      formats.set(probe.key, {
        ...existing,
        support,
      });
    }
  });

  return Array.from(formats.values())
    .sort((left, right) => left.order - right.order)
    .map(({ label, support }) => ({
      label,
      support,
    }));
}

export function detectBrowserMediaSupport(
  audioCanPlayType: CanPlayTypeFn,
  videoCanPlayType: CanPlayTypeFn,
): BrowserMediaSupport {
  return {
    audio: detectSupportedFormats(AUDIO_FORMAT_PROBES, audioCanPlayType),
    video: detectSupportedFormats(VIDEO_FORMAT_PROBES, videoCanPlayType),
  };
}
