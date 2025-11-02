import { timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";

type DecoratedSubtitle = {
  subtitle: Subtitle;
  start: number;
  end: number;
  index: number;
};

const decorateSubtitles = (subtitles: Subtitle[]): DecoratedSubtitle[] =>
  subtitles.map((subtitle, index) => ({
    subtitle,
    start: timeToSeconds(subtitle.startTime),
    end: timeToSeconds(subtitle.endTime),
    index,
  }));

export const sortSubtitlesChronologically = (
  subtitles: Subtitle[],
): Subtitle[] => {
  if (subtitles.length <= 1) {
    return subtitles;
  }

  const decorated = decorateSubtitles(subtitles);
  const sorted = decorated.slice().sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    if (a.end !== b.end) {
      return a.end - b.end;
    }
    if (a.subtitle.id !== b.subtitle.id) {
      return a.subtitle.id - b.subtitle.id;
    }
    return a.subtitle.uuid.localeCompare(b.subtitle.uuid);
  });

  let orderChanged = false;
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i].index !== i) {
      orderChanged = true;
      break;
    }
  }

  if (!orderChanged) {
    return subtitles;
  }

  return sorted.map((entry) => entry.subtitle);
};
