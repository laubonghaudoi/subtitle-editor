"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";

const STEP_FINE = 0.001; // 1ms
const STEP_TEN = 0.01; // 10ms
const STEP_MEDIUM = 0.1; // 100ms
const STEP_COARSE = 1; // 1s
const INITIAL_SLIDER_LIMIT_SECONDS = 10;
const SLIDER_LIMIT_INCREMENT = 1;
const SLIDER_EXPANSION_MARGIN = SLIDER_LIMIT_INCREMENT / 2;

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
  const t = useTranslations();
  const [sliderLimit, setSliderLimit] = useState(INITIAL_SLIDER_LIMIT_SECONDS);

  const ensureSliderLimit = useCallback((value: number) => {
    const absValue = Math.abs(value);
    setSliderLimit((currentLimit) => {
      const expansionThreshold = Math.max(
        INITIAL_SLIDER_LIMIT_SECONDS,
        currentLimit - SLIDER_EXPANSION_MARGIN,
      );
      if (absValue < expansionThreshold) {
        return currentLimit;
      }
      const requiredLimit =
        Math.ceil(absValue / SLIDER_LIMIT_INCREMENT) * SLIDER_LIMIT_INCREMENT +
        SLIDER_LIMIT_INCREMENT;
      const nextLimit = Math.max(
        currentLimit + SLIDER_LIMIT_INCREMENT,
        requiredLimit,
      );
      return Math.max(nextLimit, INITIAL_SLIDER_LIMIT_SECONDS);
    });
  }, []);

  const formattedOffset = offsetSeconds.toFixed(3);
  const roundedOffset = Number(offsetSeconds.toFixed(3));
  const sliderValue =
    roundedOffset > sliderLimit
      ? sliderLimit
      : roundedOffset < -sliderLimit
        ? -sliderLimit
        : roundedOffset;

  useEffect(() => {
    if (offsetSeconds === 0) {
      setSliderLimit((currentLimit) =>
        currentLimit === INITIAL_SLIDER_LIMIT_SECONDS
          ? currentLimit
          : INITIAL_SLIDER_LIMIT_SECONDS,
      );
      return;
    }
    ensureSliderLimit(offsetSeconds);
  }, [offsetSeconds, ensureSliderLimit]);

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
    const nextValue = Number((offsetSeconds + delta).toFixed(3));
    ensureSliderLimit(nextValue);
    onOffsetChange(nextValue);
  };

  const handleInputChange = (value: string) => {
    if (value.trim().length === 0) {
      setSliderLimit(INITIAL_SLIDER_LIMIT_SECONDS);
      onOffsetChange(0);
      return;
    }
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    const nextValue = Number(parsed.toFixed(3));
    ensureSliderLimit(nextValue);
    onOffsetChange(nextValue);
  };

  const handleReset = () => {
    setSliderLimit(INITIAL_SLIDER_LIMIT_SECONDS);
    onOffsetChange(0);
  };

  return (
    <section className="h-fit px-4 py-3 border-t-1 border-black border-dashed">
      <div className="flex flex-grow items-center gap-4 text-sm tracking-wide">
        <span>{t("bulkOffset.chooseTarget")}</span>
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
            {t("bulkOffset.targetStart")}
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
            {t("bulkOffset.targetBoth")}
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
            {t("bulkOffset.targetEnd")}
          </Button>
        </div>
        {selectionSummary && (
          <span className="text-sm text-muted-foreground">
            {selectionSummary}
          </span>
        )}
      </div>

      <div className="my-3 flex items-center gap-4 text-sm tracking-wide">
        <span className="w-fit">{t("bulkOffset.offsetLabel")}</span>
        <SliderPrimitive.Root
          value={[sliderValue]}
          min={-sliderLimit}
          max={sliderLimit}
          step={STEP_FINE}
          className="relative flex select-none items-center grow"
          onValueChange={(value) => {
            const nextValue = Number(value[0]?.toFixed(3) ?? "0");
            ensureSliderLimit(nextValue);
            onOffsetChange(nextValue);
          }}
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
            aria-label={t("bulkOffset.aria.decreaseOneSecond")}
          >
            −1s
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(-STEP_MEDIUM)}
            aria-label={t("bulkOffset.aria.decreaseHundredMs")}
          >
            −100ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(-STEP_TEN)}
            aria-label={t("bulkOffset.aria.decreaseTenMs")}
          >
            −10ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(-STEP_FINE)}
            aria-label={t("bulkOffset.aria.decreaseOneMs")}
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
            aria-label={t("bulkOffset.offsetInputLabel")}
          />
          <span>s</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_FINE)}
            aria-label={t("bulkOffset.aria.increaseOneMs")}
          >
            +1ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_TEN)}
            aria-label={t("bulkOffset.aria.increaseTenMs")}
          >
            +10ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_MEDIUM)}
            aria-label={t("bulkOffset.aria.increaseHundredMs")}
          >
            +100ms
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleDelta(STEP_COARSE)}
            aria-label={t("bulkOffset.aria.increaseOneSecond")}
          >
            +1s
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={handleReset}
          >
            {t("bulkOffset.reset")}
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
            {t("bulkOffset.apply")}
          </Button>
        </div>
      </div>
    </section>
  );
}
