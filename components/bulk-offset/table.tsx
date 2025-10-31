"use client";

import { useRef } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";

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
  onToggleAll: (checked: boolean | "indeterminate") => void;
  headerCheckboxState: boolean | "indeterminate";
  trackColor: string;
}

export function BulkOffsetTable({
  subtitles,
  previewSubtitles,
  selectedUuids,
  onToggleRow,
  onToggleAll,
  headerCheckboxState,
  trackColor,
}: BulkOffsetTableProps) {
  const shiftPressedRef = useRef(false);
  return (
    <table className="min-w-full text-base">
      <thead className="sticky top-0 z-20 bg-background shadow-sm">
        <tr className="border-b text-black">
          <th className="h-10 px-4 text-center font-semibold text-muted-foreground flex items-center">
            <Checkbox
              aria-label="Select all captions"
              checked={headerCheckboxState}
              style={{
                borderColor: trackColor,
                backgroundColor:
                  headerCheckboxState === true ? trackColor : "transparent",
                color: headerCheckboxState === true ? "#fff" : trackColor,
              }}
              onCheckedChange={onToggleAll}
            />
          </th>
          <th className="h-10 px-2 text-left font-semibold text-muted-foreground">
            ID
          </th>
          <th className="h-10 px-2 text-center font-semibold text-muted-foreground">
            Start
          </th>
          <th className="h-10 px-2 text-center font-semibold text-muted-foreground">
            Preview start
          </th>
          <th className="h-10 px-2 text-center font-semibold text-muted-foreground">
            End
          </th>
          <th className="h-10 px-2 text-center font-semibold text-muted-foreground">
            Preview end
          </th>
          <th className="h-10 px-2 text-center font-semibold text-muted-foreground">
            Text
          </th>
        </tr>
      </thead>
      <tbody>
        {subtitles.map((subtitle, index) => {
          const isChecked = selectedUuids.has(subtitle.uuid);
          const preview = previewSubtitles[index];
          const previewStartStyle = preview.startChanged
            ? { color: trackColor }
            : undefined;
          const previewEndStyle = preview.endChanged
            ? { color: trackColor }
            : undefined;
          return (
            <tr
              key={subtitle.uuid}
              className={cn(
                "border-b border-dashed transition-colors hover:bg-muted/50 last:border-b-0",
                isChecked && "bg-secondary/30",
              )}
            >
              <td className="px-4 align-middle">
                <Checkbox
                  aria-label={`Select caption ${subtitle.id}`}
                  checked={isChecked}
                  style={{
                    borderColor: trackColor,
                    backgroundColor: isChecked ? trackColor : "transparent",
                    color: isChecked ? "#fff" : trackColor,
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
              </td>
              <td className="px-2 py-1 text-left text-sm text-muted-foreground">
                {subtitle.id}
              </td>
              <td className="px-2 py-1 align-middle font-mono text-center">
                {subtitle.startTime}
              </td>
              <td
                className="px-2 py-1 align-middle font-mono text-center"
                style={previewStartStyle}
              >
                {preview.previewStart}
              </td>
              <td className="px-2 py-1 align-middle font-mono text-center">
                {subtitle.endTime}
              </td>
              <td
                className="px-2 py-1 align-middle font-mono text-center"
                style={previewEndStyle}
              >
                {preview.previewEnd}
              </td>
              <td className="px-4 py-1 align-middle text-muted-foreground">
                {subtitle.text || <span className="italic">Empty</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
