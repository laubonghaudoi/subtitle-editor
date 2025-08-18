import { IconPlayerPause, IconPlayerPlay, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import type React from "react";
import { memo, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { secondsToTime } from "@/lib/utils";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

// Memoized component for the time-sensitive parts
const TimeDisplayAndSlider = memo(
  ({
    playbackTime,
    duration,
    onSeek,
  }: {
    playbackTime: number;
    duration: number;
    onSeek: (time: number) => void;
  }) => {
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<number>(0);
    const sliderRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const clampedX = Math.max(0, Math.min(relativeX, rect.width));
        const position = rect.width === 0 ? 0 : clampedX / rect.width;
        const time = position * duration;
        setHoverTime(time);
        setTooltipPosition(clampedX);
      }
    };

    const handleMouseLeave = () => {
      setHoverTime(null);
    };

    return (
      <>
        <div
          ref={sliderRef}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={playbackTime}
          aria-valuetext={`Time: ${secondsToTime(playbackTime)}`}
          tabIndex={0}
          className="w-full relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <TooltipProvider>
            <Tooltip open={hoverTime !== null}>
              <TooltipTrigger asChild>
                <Slider
                  value={[playbackTime]}
                  max={duration}
                  step={0.01}
                  onValueChange={(value) => onSeek(value[0])}
                  className="w-full"
                />
              </TooltipTrigger>
              {hoverTime !== null && (
                <TooltipContent
                  side="top"
                  className="bg-white text-black py-1 px-2 text-sm rounded border-2 border-black"
                  style={{
                    position: "absolute",
                    left: `${tooltipPosition}px`,
                    transform: "translateX(-50%)",
                    bottom: "4px",
                  }}
                >
                  {secondsToTime(hoverTime)}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-sm w-fit">
          {secondsToTime(playbackTime)} / {secondsToTime(duration)}
        </span>
      </>
    );
  }
);

TimeDisplayAndSlider.displayName = "TimeDisplayAndSlider";

interface CustomControlsProps {
  isPlaying: boolean;
  playbackTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: string) => void;
  onTimeJump: (seconds: number) => void;
  jumpDuration: number;
  onChangeJumpDuration: (seconds: string) => void;
}

export default function CustomControls({
  isPlaying,
  playbackTime,
  duration,
  onPlayPause,
  onTimeJump,
  jumpDuration,
  onChangeJumpDuration,
  onSeek,
  playbackRate,
  onChangePlaybackRate,
}: CustomControlsProps) {
  return (
    <div className="p-4 flex items-center gap-4 h-[5vh] border-t-2 border-b-2 border-black">
      <Button onClick={onPlayPause} variant="ghost" className="cursor-pointer">
        {isPlaying ? (
          <IconPlayerPause size={20} />
        ) : (
          <IconPlayerPlay size={20} />
        )}
      </Button>

      <div className="flex items-center gap-1 border-x-1 border-gray-300 px-4">
          <Button
            onClick={() => onTimeJump(-jumpDuration)}
            variant="ghost"
            className="px-2"
          >
            <IconChevronsLeft />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="px-2 py-2">{jumpDuration}s</DropdownMenuTrigger>
            <DropdownMenuContent className="border-1 border-black">
              <DropdownMenuRadioGroup
                value={jumpDuration.toString()}
                onValueChange={onChangeJumpDuration}
              >
                <DropdownMenuRadioItem value="1">1s</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="2">2s</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="5">5s</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="10">10s</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => onTimeJump(jumpDuration)}
            variant="ghost"
            className="px-2"
          >
            <IconChevronsRight />
          </Button>
        </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="">{playbackRate}x</DropdownMenuTrigger>
        <DropdownMenuContent className="border-1 border-black">
          <DropdownMenuRadioGroup
            value={playbackRate.toString()}
            onValueChange={onChangePlaybackRate}
          >
            <DropdownMenuRadioItem value="0.5">0.5x</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="0.75">0.75x</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="1">1x</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="1.25">1.25x</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="1.5">1.5x</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">2x</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="3">3x</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="4">4x</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <TimeDisplayAndSlider
        playbackTime={playbackTime}
        duration={duration}
        onSeek={onSeek}
      />
    </div>
  );
}
