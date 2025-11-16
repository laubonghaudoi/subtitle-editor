import type { BulkOffsetPreviewState } from "@/components/bulk-offset/drawer";
import {
  createContrastColor,
  getTrackHandleColor,
  hexToRgba,
} from "@/lib/track-colors";
import { useCallback, useRef } from "react";
import type WaveSurfer from "wavesurfer.js";
import type { Region } from "wavesurfer.js/dist/plugins/regions.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import type { RegionMapEntry } from "./use-label-measurements";

/**
 * Manages the translucent overlay regions shown during bulk offset preview.
 * Keeps the main region map intact and only renders additional overlays
 * when a particular subtitle has pending start/end changes.
 */
export function usePreviewRegions(
  wavesurfer: WaveSurfer | null,
  subtitleToRegionMap: React.MutableRefObject<Map<string, RegionMapEntry>>,
  theme: "light" | "dark",
) {
  const previewRegionMap = useRef<Map<string, Region>>(new Map());
  const previewOffsetsRef = useRef<Record<string, BulkOffsetPreviewState>>({});

  const updatePreviewRegions = useCallback(
    (previewMap: Record<string, BulkOffsetPreviewState>) => {
      if (!wavesurfer) return;
      let duration = 0;
      try {
        duration = wavesurfer.getDuration();
      } catch {
        duration = 0;
      }
      if (!duration) return;

      const regionsPlugin = wavesurfer
        .getActivePlugins()
        .find((plugin) => plugin instanceof RegionsPlugin) as
        | RegionsPlugin
        | undefined;
      if (!regionsPlugin) return;

      previewRegionMap.current.forEach((overlay, uuid) => {
        const entry = previewMap[uuid];
        if (!entry || (!entry.startChanged && !entry.endChanged)) {
          overlay.remove();
          previewRegionMap.current.delete(uuid);
        }
      });

      Object.entries(previewMap).forEach(([uuid, data]) => {
        const hasDiff = data.startChanged || data.endChanged;
        const baseRegionEntry = subtitleToRegionMap.current.get(uuid);
        if (!hasDiff || !baseRegionEntry) {
          const existing = previewRegionMap.current.get(uuid);
          if (existing) {
            existing.remove();
            previewRegionMap.current.delete(uuid);
          }
          return;
        }
        const { region: baseRegion, trackIndex } = baseRegionEntry;
        const handleColor = getTrackHandleColor(trackIndex);
        const contrast = createContrastColor(handleColor);
        const overlayFill = hexToRgba(contrast, 0.18);
        const overlayBorder = hexToRgba(contrast, 0.82);

        let overlay = previewRegionMap.current.get(uuid);
        if (!overlay) {
          overlay = regionsPlugin.addRegion({
            id: `preview-${uuid}`,
            start: data.startSeconds,
            end: data.endSeconds,
            drag: false,
            resize: false,
            color: overlayFill,
          });
          previewRegionMap.current.set(uuid, overlay);
        } else {
          overlay.setOptions({
            start: data.startSeconds,
            end: data.endSeconds,
            color: overlayFill,
          });
        }

        const element = overlay.element;
        if (element) {
          element.style.pointerEvents = "none";
          element.style.zIndex = "5";
          element.style.border = `2px dashed ${overlayBorder}`;
          element.style.backgroundColor = overlayFill;
          element.style.mixBlendMode = "screen";
          element.setAttribute("data-preview-region", "true");

          const baseElement = baseRegion.element;
          if (baseElement) {
            element.style.top = baseElement.style.top;
            element.style.height = baseElement.style.height;
            element.style.position = "absolute";
          }

          const leftHandle = element.querySelector(
            'div[part="region-handle region-handle-left"]',
          ) as HTMLDivElement | null;
          const rightHandle = element.querySelector(
            'div[part="region-handle region-handle-right"]',
          ) as HTMLDivElement | null;
          if (leftHandle) leftHandle.style.display = "none";
          if (rightHandle) rightHandle.style.display = "none";
        }
      });
    },
    [subtitleToRegionMap, theme, wavesurfer],
  );

  const clearPreviewRegions = useCallback(() => {
    previewRegionMap.current.forEach((region) => region.remove());
    previewRegionMap.current.clear();
  }, []);

  return {
    previewOffsetsRef,
    updatePreviewRegions,
    clearPreviewRegions,
  };
}
