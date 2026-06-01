"use client";

import { Fragment, useRef } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useTranslations } from "next-intl";

export interface PreviewSubtitle {
  previewStart: string;
  previewEnd: string;
  startChanged: boolean;
  endChanged: boolean;
}

interface BulkOffsetTableProps {
  subtitles: Subtitle[];
  previewSubtitles: PreviewSubtitle[];
  selectedUuids: Set<string>;
  onToggleRow: (
    index: number,
    uuid: string,
    shouldSelect: boolean,
    shiftKey: boolean,
  ) => void;
  onToggleAll: (checked: CheckedState) => void;
  headerCheckboxState: CheckedState;
  trackColor: string;
  trackBackgroundColor: string;
  inkColor: string;
}

export function BulkOffsetTable({
  subtitles,
  previewSubtitles,
  selectedUuids,
  onToggleRow,
  onToggleAll,
  headerCheckboxState,
  trackColor,
  trackBackgroundColor,
  inkColor,
}: BulkOffsetTableProps) {
  const t = useTranslations();
  const shiftPressedRef = useRef(false);
  return (
    <table className="min-w-full text-base">
      <thead className="sticky top-0 z-20 bg-background">
        <tr>
          <th
            className="h-12 bg-background px-4 text-center align-middle text-sm font-semibold leading-tight"
            rowSpan={2}
          >
            <div className="flex items-center justify-center">
              <Checkbox
                aria-label={t("bulkOffset.selectAll")}
                checked={headerCheckboxState}
                style={{
                  borderColor: inkColor,
                  backgroundColor:
                    headerCheckboxState === true ? trackColor : "transparent",
                  color: headerCheckboxState === true ? "#000" : inkColor,
                }}
                onCheckedChange={onToggleAll}
              />
            </div>
          </th>
          <th
            className="h-12 bg-background px-2 text-left align-middle text-sm font-semibold leading-tight"
            rowSpan={2}
          >
            {t("bulkOffset.table.id")}
          </th>
          <th className="relative h-6 bg-background px-2 py-0 text-center text-sm font-semibold leading-tight">
            {t("bulkOffset.table.start")}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[repeating-linear-gradient(to_right,currentColor_0_5px,transparent_5px_8px)]"
            />
          </th>
          <th className="relative h-6 bg-background px-2 py-0 text-center text-sm font-semibold leading-tight">
            {t("bulkOffset.table.end")}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[repeating-linear-gradient(to_right,currentColor_0_5px,transparent_5px_8px)]"
            />
          </th>
          <th
            className="h-12 bg-background px-2 text-center align-middle text-sm font-semibold leading-tight"
            rowSpan={2}
          >
            {t("bulkOffset.table.text")}
          </th>
        </tr>
        <tr className="border-b">
          <th className="h-6 bg-background px-2 py-0 text-center text-sm font-semibold leading-tight">
            {t("bulkOffset.table.previewStart")}
          </th>
          <th className="h-6 bg-background px-2 py-0 text-center text-sm font-semibold leading-tight">
            {t("bulkOffset.table.previewEnd")}
          </th>
        </tr>
      </thead>
      <tbody>
        {subtitles.map((subtitle, index) => {
          const isChecked = selectedUuids.has(subtitle.uuid);
          const preview = previewSubtitles[index];
          const previewStartStyle = preview.startChanged
            ? { color: inkColor }
            : undefined;
          const previewEndStyle = preview.endChanged
            ? { color: inkColor }
            : undefined;
          const rowStyle = isChecked
            ? { backgroundColor: trackBackgroundColor }
            : undefined;
          return (
            <Fragment key={subtitle.uuid}>
              <tr
                className={cn("transition-colors hover:bg-muted/50")}
                style={rowStyle}
              >
                <td className="px-4 align-middle" rowSpan={2}>
                  {/* flex wrapper centers by the box (not the text baseline) so
                      the checkbox doesn't shift ~1px when Radix mounts the
                      checkmark Indicator on check — matches the header cell */}
                  <div className="flex items-center justify-center">
                    <Checkbox
                      aria-label={t("bulkOffset.selectCaption", {
                        id: subtitle.id,
                      })}
                      checked={isChecked}
                      style={{
                        borderColor: inkColor,
                        backgroundColor: isChecked ? trackColor : "transparent",
                        color: isChecked ? "#000" : inkColor,
                      }}
                      onPointerDown={(event) => {
                        shiftPressedRef.current = event.shiftKey;
                      }}
                      onCheckedChange={(checked) => {
                        onToggleRow(
                          index,
                          subtitle.uuid,
                          checked === true,
                          shiftPressedRef.current,
                        );
                        shiftPressedRef.current = false;
                      }}
                    />
                  </div>
                </td>
                <td className="px-2 py-1 text-left text-sm" rowSpan={2}>
                  {subtitle.id}
                </td>
                <td className="px-2 pt-1 pb-0 align-middle font-mono text-center">
                  {subtitle.startTime}
                </td>
                <td className="px-2 pt-1 pb-0 align-middle font-mono text-center">
                  {subtitle.endTime}
                </td>
                <td className="px-4 py-1 align-middle" rowSpan={2}>
                  {subtitle.text || (
                    <span className="italic">
                      {t("bulkOffset.table.empty")}
                    </span>
                  )}
                </td>
              </tr>
              <tr
                className={cn(
                  "border-b border-dashed transition-colors hover:bg-muted/50 last:border-b-0",
                )}
                style={rowStyle}
              >
                <td
                  className="px-2 pt-0 pb-1 align-middle font-mono text-center"
                  style={previewStartStyle}
                >
                  {preview.previewStart}
                </td>
                <td
                  className="px-2 pt-0 pb-1 align-middle font-mono text-center"
                  style={previewEndStyle}
                >
                  {preview.previewEnd}
                </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
