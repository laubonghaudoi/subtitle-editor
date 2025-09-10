import { AnimatePresence } from "motion/react";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"; // Remove useCallback import
import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { parseSRT } from "@/lib/subtitleOperations";
import { timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import SubtitleItem from "./subtitle-item";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { useTranslations } from "next-intl";

// Remove subtitle-related props
interface SubtitleListProps {
  currentTime?: number;
  onScrollToRegion: (uuid: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackTime: (time: number) => void;
  editingSubtitleUuid: string | null;
  setEditingSubtitleUuid: React.Dispatch<React.SetStateAction<string | null>>;
}

// Define the ref interface for SubtitleList
export interface SubtitleListRef {
  scrollToSubtitle: (uuid: string) => void;
}

const SubtitleList = forwardRef<SubtitleListRef, SubtitleListProps>(({
  currentTime = 0,
  onScrollToRegion,
  setIsPlaying,
  setPlaybackTime,
  editingSubtitleUuid,
  setEditingSubtitleUuid,
}, ref) => {
  const t = useTranslations();
  const listRef = useRef<HTMLDivElement>(null);
  const activeSubtitleRef = useRef<string | null>(null);
  // Get subtitles and actions from context
  const {
    subtitles,
    mergeSubtitlesAction,
    loadSubtitlesIntoTrack,
    renameTrack,
    activeTrackId,
  } = useSubtitleContext();

  // Expose scrollToSubtitle method via ref
  useImperativeHandle(ref, () => ({
    scrollToSubtitle: (uuid: string) => {
      const subtitleElement = document.getElementById(`subtitle-${uuid}`);
      if (subtitleElement && listRef.current) {
        subtitleElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    },
  }));

  const handleSrtFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !activeTrackId) return;

    const newSubtitles = parseSRT(await file.text());
    loadSubtitlesIntoTrack(activeTrackId, newSubtitles);
    renameTrack(activeTrackId, file.name.replace(".srt", ""));
  };

  const handleStartFromScratch = () => {
    if (!activeTrackId) return;
    loadSubtitlesIntoTrack(activeTrackId, [
      {
        uuid: uuidv4(),
        id: 1,
        startTime: "00:00:00,000",
        endTime: "00:00:03,000",
        text: t("subtitle.newSubtitle"),
      },
    ]);
  };

  // Scroll to the current subtitle based on playback time
  useEffect(() => {
    if (!listRef.current) return;

    // Find the current subtitle based on playback time
    const currentSubtitle = subtitles.find(
      (sub) =>
        timeToSeconds(sub.startTime) <= currentTime &&
        timeToSeconds(sub.endTime) >= currentTime
    );

    if (currentSubtitle && currentSubtitle.uuid !== activeSubtitleRef.current) {
      // Use uuid for the element ID
      const subtitleElement = document.getElementById(
        `subtitle-${currentSubtitle.uuid}`
      );
      if (subtitleElement) {
        subtitleElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        activeSubtitleRef.current = currentSubtitle.uuid;
      }
    }
  }, [currentTime, subtitles]);

  // Keyboard shortcuts effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditing =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA");

      // --- Shift + Backspace (Merge Previous) ---
      // This should work even when editing
      if (event.shiftKey && event.key === "Backspace") {
        // Find the index of the currently active subtitle (same logic as arrows)
        let currentIndex = subtitles.findIndex(
          (sub) =>
            timeToSeconds(sub.startTime) <= currentTime &&
            timeToSeconds(sub.endTime) > currentTime
        );

        // If no subtitle is active, find the closest one before the current time
        if (currentIndex === -1) {
          currentIndex = subtitles.findLastIndex(
            (sub) => timeToSeconds(sub.startTime) <= currentTime
          );
        }

        // Check if a valid current subtitle was found and it's not the first one
        if (currentIndex !== -1 && currentIndex > 0) {
          event.preventDefault(); // Prevent default browser back navigation etc.
          const previousSubtitleId = subtitles[currentIndex - 1].id;
          const currentSubtitleId = subtitles[currentIndex].id;
          mergeSubtitlesAction(previousSubtitleId, currentSubtitleId);
          // Potentially blur the input after merge?
          // if (isEditing && activeElement instanceof HTMLElement) {
          //   activeElement.blur();
          // }
        }
        // Important: Return here so the rest of the handler doesn't run
        // if the shortcut was triggered, especially the input check below.
        return;
      }

      // --- Arrow Keys (Navigate Subtitles) ---
      // This should NOT work when editing
      if (isEditing) {
        return; // Ignore arrow keys if editing
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault(); // Prevent default page scroll

        // Find the index of the currently active subtitle
        let currentIndex = subtitles.findIndex(
          (sub) =>
            timeToSeconds(sub.startTime) <= currentTime &&
            timeToSeconds(sub.endTime) > currentTime // Use the corrected logic
        );

        // If no subtitle is active, find the closest one before the current time
        if (currentIndex === -1) {
          currentIndex = subtitles.findLastIndex(
            (sub) => timeToSeconds(sub.startTime) <= currentTime
          );
          // If still not found (e.g., time is before the first subtitle), default to 0
          if (currentIndex === -1) {
            currentIndex = 0;
          }
        }

        let targetIndex = currentIndex;
        if (event.key === "ArrowUp") {
          targetIndex = Math.max(0, currentIndex - 1);
        } else if (event.key === "ArrowDown") {
          targetIndex = Math.min(subtitles.length - 1, currentIndex + 1);
        }

        if (targetIndex !== currentIndex && subtitles[targetIndex]) {
          const targetTime = timeToSeconds(subtitles[targetIndex].startTime);
          setPlaybackTime(targetTime);
          // Optionally pause playback when navigating?
          // setIsPlaying(false);
        } else if (targetIndex === currentIndex && subtitles[targetIndex]) {
          // If pressing up/down on the first/last item, still jump to its start
          const targetTime = timeToSeconds(subtitles[targetIndex].startTime);
          setPlaybackTime(targetTime);
        }
      }
      // The Shift+Backspace logic is now handled above the isEditing check
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // Effect depends on the values used inside handleKeyDown
  }, [subtitles, currentTime, setPlaybackTime, mergeSubtitlesAction]); // Add mergeSubtitlesAction dependency

  if (subtitles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-sm">
        <Label className="cursor-pointer text-xl hover:text-blue-500 underline">
          <span>{t("labels.loadSrtFile")}</span>
          <Input
            type="file"
            className="hidden"
            accept=".srt"
            onChange={handleSrtFileSelect}
          />
        </Label>
        <p className="text-xl my-4">{t("labels.or")}</p>
        <Button
          variant="link"
          onClick={handleStartFromScratch}
          className="cursor-pointer text-xl text-muted-foreground underline hover:text-blue-500"
        >
          {t("labels.startFromScratch")}
        </Button>
      </div>
    );
  }

  return (
    <div ref={listRef} className="h-full overflow-y-scroll">
      <AnimatePresence>
        {subtitles.map((subtitle: Subtitle, index: number) => {
          const isLastItem = index === subtitles.length - 1;
          const nextSubtitle = isLastItem ? null : subtitles[index + 1];
          return (
            <SubtitleItem
              key={subtitle.uuid}
              subtitle={subtitle}
              nextSubtitle={nextSubtitle}
              index={index}
              isLastItem={isLastItem}
              currentTime={currentTime}
              editingSubtitleUuid={editingSubtitleUuid}
              onScrollToRegion={onScrollToRegion}
              setEditingSubtitleUuid={setEditingSubtitleUuid}
              setIsPlaying={setIsPlaying}
              setPlaybackTime={setPlaybackTime}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
});

SubtitleList.displayName = 'SubtitleList';

export default SubtitleList;
