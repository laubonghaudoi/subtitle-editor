"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useMemo, type CSSProperties } from "react";

const STEP_FINE = 0.001; // 1ms
const STEP_TEN = 0.01; // 10ms
const STEP_MEDIUM = 0.1; // 100ms
const STEP_COARSE = 1; // 1s
const SLIDER_LIMIT_SECONDS = 10;

function hexToRgba(hex: string, alpha: number): string {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const bigint = Number.parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type BulkShiftTarget = "start" | "end" | "both";

interface BulkOffsetControlsProps {
  offsetSeconds: number;
  onOffsetChange: (value: number) => void;
  onApply: () => void;
  isApplyDisabled?: boolean;
  className?: string;
  heading?: string;
  description?: string;
  selectionSummary?: string;
  shiftTarget: BulkShiftTarget;
  onShiftTargetChange: (target: BulkShiftTarget) => void;
  accentColor: string;
}

export function BulkOffsetControls({
  offsetSeconds,
  onOffsetChange,
  onApply,
  isApplyDisabled = false,
  shiftTarget,
  onShiftTargetChange,
  selectionSummary,
  accentColor,
}: BulkOffsetControlsProps) {
  const formattedOffset = useMemo(
    () => offsetSeconds.toFixed(3),
    [offsetSeconds],
  );
  const sliderValue = useMemo(() => {
    if (offsetSeconds > SLIDER_LIMIT_SECONDS) return SLIDER_LIMIT_SECONDS;
    if (offsetSeconds < -SLIDER_LIMIT_SECONDS) return -SLIDER_LIMIT_SECONDS;
    return Number(offsetSeconds.toFixed(3));
  }, [offsetSeconds]);

  const activeToggleStyle: CSSProperties = {
    backgroundColor: accentColor,
    borderColor: accentColor,
    color: "#fff",
  };

  const inactiveToggleStyle: CSSProperties = {
    backgroundColor: "transparent",
    borderColor: accentColor,
    color: accentColor,
  };

  const handleDelta = (delta: number) => {
    onOffsetChange(Number((offsetSeconds + delta).toFixed(3)));
  };

  const handleInputChange = (value: string) => {
    if (value.trim().length === 0) {
      onOffsetChange(0);
      return;
    }
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    onOffsetChange(Number(parsed.toFixed(3)));
  };

  return (
    <section className="h-fit px-4 py-3 border-t-1 border-black border-dashed">
      <div className="flex flex-grow items-center gap-4 text-sm tracking-wide">
        <span>Choose to offset</span>
        <div className="flex items-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onShiftTargetChange("start")}
            aria-pressed={shiftTarget === "start"}
            className="rounded-none text-sm border-r-0"
            style={
              shiftTarget === "start" ? activeToggleStyle : inactiveToggleStyle
            }
          >
            Start time
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onShiftTargetChange("both")}
            aria-pressed={shiftTarget === "both"}
            className="rounded-none text-sm border-l-0 border-r-0"
            style={
              shiftTarget === "both" ? activeToggleStyle : inactiveToggleStyle
            }
          >
            Whole subtitle
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onShiftTargetChange("end")}
            aria-pressed={shiftTarget === "end"}
            className="rounded-none text-sm border-l-0"
            style={
              shiftTarget === "end" ? activeToggleStyle : inactiveToggleStyle
            }
          >
            End time
          </Button>
        </div>
        {selectionSummary && (
          <span className="text-sm text-muted-foreground">
            {selectionSummary}
          </span>
        )}
      </div>

      <div className="my-3 flex items-center gap-4 text-sm tracking-wide">
        <span className="w-fit">Offset seconds</span>
        <SliderPrimitive.Root
          value={[sliderValue]}
          min={-SLIDER_LIMIT_SECONDS}
          max={SLIDER_LIMIT_SECONDS}
          step={STEP_FINE}
          className="relative flex select-none items-center grow"
          onValueChange={(value) =>
            onOffsetChange(Number(value[0]?.toFixed(3) ?? "0"))
          }
        >
          <SliderPrimitive.Track
            className="relative h-1 w-full grow overflow-hidden rounded-full"
            style={{ backgroundColor: hexToRgba(accentColor, 0.2) }}
          >
            <SliderPrimitive.Range
              className="absolute h-full"
              style={{ backgroundColor: accentColor }}
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className="block h-4 w-4 rounded-full border-2 bg-background shadow transition-transform focus-visible:outline-hidden focus-visible:ring-2 data-[state=active]:scale-110 disabled:pointer-events-none disabled:opacity-50"
            style={{
              borderColor: accentColor,
              boxShadow: `0 1px 2px ${hexToRgba(accentColor, 0.35)}`,
            }}
          />
        </SliderPrimitive.Root>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(-STEP_COARSE)}
            aria-label="Decrease offset by 1 second"
          >
            −1s
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(-STEP_MEDIUM)}
            aria-label="Decrease offset by 0.1 seconds"
          >
            −0.1s
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(-STEP_TEN)}
            aria-label="Decrease offset by 10 milliseconds"
          >
            −10ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(-STEP_FINE)}
            aria-label="Decrease offset by 1 millisecond"
          >
            −1ms
          </Button>
        </div>

        <div className="flex items-center gap-4 mx-2">
          <Input
            type="number"
            inputMode="decimal"
            step={STEP_FINE}
            value={formattedOffset}
            onChange={(event) => handleInputChange(event.target.value)}
            className="w-24 py-1 px-2 rounded-xs border-none text-center text-base"
            aria-label="Offset in seconds"
          />
          <span>s</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_FINE)}
            aria-label="Increase offset by 1 millisecond"
          >
            +1ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_TEN)}
            aria-label="Increase offset by 10 milliseconds"
          >
            +10ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_MEDIUM)}
            aria-label="Increase offset by 0.1 seconds"
          >
            +100ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_COARSE)}
            aria-label="Increase offset by 1 second"
          >
            +1s
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={() => onOffsetChange(0)}
          >
            Reset
          </Button>
          <Button
            type="button"
            size="default"
            variant="secondary"
            onClick={onApply}
            disabled={isApplyDisabled}
            style={{
              backgroundColor: accentColor,
              borderColor: accentColor,
              color: "#fff",
            }}
          >
            Apply offset
          </Button>
        </div>
      </div>
    </section>
  );
}
