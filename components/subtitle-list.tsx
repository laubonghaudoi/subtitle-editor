import { AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react"; // Remove useCallback import
import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import SubtitleItem from "./subtitle-item";

// Remove subtitle-related props
interface SubtitleListProps {
  currentTime?: number;
  onScrollToRegion: (uuid: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackTime: (time: number) => void;
  editingSubtitleUuid: string | null;
  setEditingSubtitleUuid: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function SubtitleList({
  currentTime = 0,
  onScrollToRegion,
  setIsPlaying,
  setPlaybackTime,
  editingSubtitleUuid,
  setEditingSubtitleUuid,
}: SubtitleListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeSubtitleRef = useRef<string | null>(null);
  // Get subtitles and merge action from context
  const { subtitles, mergeSubtitlesAction } = useSubtitleContext();

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
}
