import { useCallback, useState, type RefObject } from "react";
import type { SubtitleTrack } from "@/types/subtitle";
import type { Region } from "wavesurfer.js/dist/plugins/regions.esm.js";

export type RegionMapEntry = {
  region: Region;
  trackId: string;
  trackIndex: number;
};

export interface LabelMeasurementResult {
  labelsOffsetTop: number;
  labelsAreaHeight: number;
  measureLabelsOverlay: () => void;
}

/**
 * Computes the placement of track labels that sit on top of the waveform.
 * The measurement depends on the actual rendered region heights, so it needs
 * to read DOM layout from the container.
 */
export function useLabelMeasurements(
  containerRef: RefObject<HTMLDivElement | null>,
  tracks: SubtitleTrack[],
  subtitleToRegionMap: React.MutableRefObject<Map<string, RegionMapEntry>>,
): LabelMeasurementResult {
  const [labelsOffsetTop, setLabelsOffsetTop] = useState(0);
  const [labelsAreaHeight, setLabelsAreaHeight] = useState(0);

  const measureLabelsOverlay = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setLabelsOffsetTop(0);
      setLabelsAreaHeight(0);
      return;
    }
    const containerRect = container.getBoundingClientRect();

    let laneHeight = 0;
    let topOfFirstLanePx: number | null = null;

    subtitleToRegionMap.current.forEach(({ region, trackId }) => {
      if (!region.element) return;
      const el = region.element as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.height > 0) {
        laneHeight = rect.height;
        const idx = tracks.findIndex((t) => t.id === trackId);
        const laneTopForThis = rect.top - containerRect.top;
        const top0 = laneTopForThis - idx * laneHeight;
        topOfFirstLanePx =
          topOfFirstLanePx === null ? top0 : Math.min(topOfFirstLanePx, top0);
      }
    });

    if (!laneHeight || topOfFirstLanePx === null) {
      setLabelsOffsetTop(0);
      setLabelsAreaHeight(0);
      return;
    }

    setLabelsOffsetTop(Math.max(0, topOfFirstLanePx));
    setLabelsAreaHeight(Math.max(0, laneHeight * Math.max(1, tracks.length)));
  }, [containerRef, subtitleToRegionMap, tracks]);

  return { labelsOffsetTop, labelsAreaHeight, measureLabelsOverlay };
}
