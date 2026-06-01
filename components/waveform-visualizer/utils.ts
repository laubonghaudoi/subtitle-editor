import { getTrackColor, getTrackHandleColor } from "@/lib/track-colors";
import { timeToSeconds } from "@/lib/utils";
import type { Subtitle, SubtitleTrack } from "@/types/subtitle";
import type WaveSurfer from "wavesurfer.js";
import RegionsPlugin, {
  type Region,
} from "wavesurfer.js/dist/plugins/regions.esm.js";
import type { RegionMapEntry } from "./use-label-measurements";

const DEFAULT_HANDLE_COLOR = "#ef4444";
type Theme = "light" | "dark";

export const createSubtitleRegionContent = (
  startTime: string,
  text: string,
  endTime: string,
  opts?: { theme?: "light" | "dark" },
): HTMLElement => {
  const headerColor = opts?.theme === "dark" ? "white" : "black";
  const content = document.createElement("div");
  // This is the style for the parent div of the region
  content.style.cssText += `
    display:flex;
    flex-direction:column;
    height:100%;
    justify-content:space-between;
  `;

  content.innerHTML = `
    <div style="display: flex;
                justify-content: space-between;
                flex-wrap:wrap;
                padding-left: 1rem;
                padding-right: 1rem;
                padding-top: 0.3rem;
                color: ${headerColor};">
      <em>${startTime}</em>
      <em>${endTime}</em>
    </div>
    <div style="padding-left: 1rem;
                padding-right: 1rem;
                padding-bottom: 1rem;
                font-size: 1rem;
                color: var(--color-foreground, #262626);">
      <span>${text}</span>
    </div>
`;

  return content;
};

export const applyRegionHandleStyles = (
  region: Region,
  handleColor: string = DEFAULT_HANDLE_COLOR,
) => {
  // I have to do all these hacky styling because the wavesurfer api doesn't allow custom styling regions
  if (!region.element) return;
  const leftHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-left"]',
  ) as HTMLDivElement | null;
  if (leftHandleDiv) {
    leftHandleDiv.style.cssText += `
      border-left: 2px solid ${handleColor};
      width: 4px;
    `;
    if (!leftHandleDiv.querySelector('[data-arrow="left"]')) {
      const arrowEl = document.createElement("span");
      arrowEl.setAttribute("data-arrow", "left");
      arrowEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: -0.5rem;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 1rem solid transparent;
        border-bottom: 1rem solid transparent;
        border-right: 0.5rem solid ${handleColor};
      `;
      leftHandleDiv.appendChild(arrowEl);
    }
  }

  const rightHandleDiv = region.element.querySelector(
    'div[part="region-handle region-handle-right"]',
  ) as HTMLDivElement | null;
  if (rightHandleDiv) {
    rightHandleDiv.style.cssText += `
      border-right: 2px solid ${handleColor};
      width: 4px;
    `;
    if (!rightHandleDiv.querySelector('[data-arrow="right"]')) {
      const arrowEl = document.createElement("span");
      arrowEl.setAttribute("data-arrow", "right");
      arrowEl.style.cssText = `
        position: absolute;
        top: 50%;
        right: -0.5rem;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 1rem solid transparent;
        border-bottom: 1rem solid transparent;
        border-left: 0.5rem solid ${handleColor};
      `;
      rightHandleDiv.appendChild(arrowEl);
    }
  }
};

export const getRegionsPlugin = (
  wavesurfer: WaveSurfer,
): RegionsPlugin | undefined =>
  wavesurfer
    .getActivePlugins()
    .find((plugin): plugin is RegionsPlugin => plugin instanceof RegionsPlugin);

export const hasStructuralRegionChange = (
  previousTracks: SubtitleTrack[],
  nextTracks: SubtitleTrack[],
): boolean => {
  if (previousTracks.length !== nextTracks.length) {
    return true;
  }

  for (let trackIndex = 0; trackIndex < nextTracks.length; trackIndex += 1) {
    const previousTrack = previousTracks[trackIndex];
    const nextTrack = nextTracks[trackIndex];
    if (!previousTrack || previousTrack.id !== nextTrack.id) {
      return true;
    }
    if (previousTrack.subtitles.length !== nextTrack.subtitles.length) {
      return true;
    }
    for (
      let subtitleIndex = 0;
      subtitleIndex < nextTrack.subtitles.length;
      subtitleIndex += 1
    ) {
      if (
        previousTrack.subtitles[subtitleIndex]?.uuid !==
        nextTrack.subtitles[subtitleIndex]?.uuid
      ) {
        return true;
      }
    }
  }

  return false;
};

const getRegionRenderKey = (subtitle: Subtitle, theme: Theme): string =>
  [theme, subtitle.startTime, subtitle.endTime, subtitle.text].join("\u001f");

export const positionRegionElement = (
  region: Region,
  trackIndex: number,
  trackCount: number,
) => {
  if (!region.element || trackCount === 0) {
    return;
  }

  const trackHeight = 100 / trackCount;
  const trackTop = trackIndex * trackHeight;
  region.element.style.top = `${trackTop}%`;
  region.element.style.height = `${trackHeight}%`;
  region.element.style.position = "absolute";
};

export const renderRegionContent = ({
  region,
  subtitle,
  trackIndex,
  theme,
  timing,
}: {
  region: Region;
  subtitle: Subtitle;
  trackIndex: number;
  theme: Theme;
  timing?: { start: number; end: number };
}): string => {
  const content = createSubtitleRegionContent(
    subtitle.startTime,
    subtitle.text,
    subtitle.endTime,
    { theme },
  );

  if (timing) {
    region.setOptions({
      start: timing.start,
      end: timing.end,
      content,
    });
  } else {
    region.setOptions({ content });
  }

  applyRegionHandleStyles(region, getTrackHandleColor(trackIndex));
  return getRegionRenderKey(subtitle, theme);
};

export const createRegionForSubtitle = ({
  regionsPlugin,
  subtitle,
  trackId,
  trackIndex,
  trackCount,
  theme,
  subtitleToRegionMap,
}: {
  regionsPlugin: RegionsPlugin;
  subtitle: Subtitle;
  trackId: string;
  trackIndex: number;
  trackCount: number;
  theme: Theme;
  subtitleToRegionMap: Map<string, RegionMapEntry>;
}): RegionMapEntry => {
  const start = timeToSeconds(subtitle.startTime);
  const end = timeToSeconds(subtitle.endTime);
  const region = regionsPlugin.addRegion({
    id: subtitle.uuid,
    start,
    end,
    content: createSubtitleRegionContent(
      subtitle.startTime,
      subtitle.text,
      subtitle.endTime,
      { theme },
    ),
    color: getTrackColor(trackIndex),
    drag: true,
    resize: true,
    minLength: 0.1,
  });
  positionRegionElement(region, trackIndex, trackCount);
  applyRegionHandleStyles(region, getTrackHandleColor(trackIndex));

  const entry = {
    region,
    trackId,
    trackIndex,
    renderKey: getRegionRenderKey(subtitle, theme),
  };
  subtitleToRegionMap.set(subtitle.uuid, entry);
  return entry;
};

export const syncRegionForSubtitle = ({
  regionsPlugin,
  subtitleToRegionMap,
  subtitle,
  trackId,
  trackIndex,
  trackCount,
  theme,
}: {
  regionsPlugin: RegionsPlugin;
  subtitleToRegionMap: Map<string, RegionMapEntry>;
  subtitle: Subtitle;
  trackId: string;
  trackIndex: number;
  trackCount: number;
  theme: Theme;
}) => {
  const regionData =
    subtitleToRegionMap.get(subtitle.uuid) ??
    createRegionForSubtitle({
      regionsPlugin,
      subtitle,
      trackId,
      trackIndex,
      trackCount,
      theme,
      subtitleToRegionMap,
    });

  const region = regionData.region;
  const nextStart = timeToSeconds(subtitle.startTime);
  const nextEnd = timeToSeconds(subtitle.endTime);
  const nextRenderKey = getRegionRenderKey(subtitle, theme);
  const shouldUpdateTiming =
    region.start !== nextStart || region.end !== nextEnd;
  const shouldUpdateContent = regionData.renderKey !== nextRenderKey;

  if (shouldUpdateTiming || shouldUpdateContent) {
    const content = shouldUpdateContent
      ? createSubtitleRegionContent(
          subtitle.startTime,
          subtitle.text,
          subtitle.endTime,
          { theme },
        )
      : undefined;
    region.setOptions({
      ...(shouldUpdateTiming ? { start: nextStart, end: nextEnd } : {}),
      ...(content ? { content } : {}),
    });
  }

  applyRegionHandleStyles(region, getTrackHandleColor(trackIndex));
  positionRegionElement(region, trackIndex, trackCount);
  subtitleToRegionMap.set(subtitle.uuid, {
    region,
    trackId,
    trackIndex,
    renderKey: nextRenderKey,
  });
};

export const pruneStaleRegions = (
  tracks: SubtitleTrack[],
  subtitleToRegionMap: Map<string, RegionMapEntry>,
) => {
  const subtitleUuids = new Set<string>();
  tracks.forEach((track) => {
    track.subtitles.forEach((subtitle) => {
      subtitleUuids.add(subtitle.uuid);
    });
  });

  for (const [uuid, regionData] of subtitleToRegionMap.entries()) {
    if (!subtitleUuids.has(uuid)) {
      regionData.region.remove();
      subtitleToRegionMap.delete(uuid);
    }
  }
};
