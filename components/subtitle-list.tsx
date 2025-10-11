import { AnimatePresence } from "motion/react";
import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"; // Remove useCallback import
import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { parseSRT, parseVTT } from "@/lib/subtitleOperations";
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
  isPlaying: boolean;
  onScrollToRegion: (uuid: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackTime: (time: number) => void;
  editingSubtitleUuid: string | null;
  setEditingSubtitleUuid: React.Dispatch<React.SetStateAction<string | null>>;
  onTimeJump: (seconds: number) => void;
  jumpDuration: number;
}

// Define the ref interface for SubtitleList
export interface SubtitleListRef {
  scrollToSubtitle: (
    uuid: string,
    opts?: { instant?: boolean; center?: boolean; focus?: boolean },
  ) => boolean;
}

const SubtitleList = forwardRef<SubtitleListRef, SubtitleListProps>(
  (
    {
      currentTime = 0,
      isPlaying,
      onScrollToRegion,
      setIsPlaying,
      setPlaybackTime,
      editingSubtitleUuid,
      setEditingSubtitleUuid,
      onTimeJump,
      jumpDuration,
    },
    ref,
  ) => {
    const t = useTranslations();
    const listRef = useRef<HTMLDivElement>(null);
    const activeSubtitleRef = useRef<string | null>(null);
    const suppressAutoCenterUuidRef = useRef<string | null>(null);
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
      scrollToSubtitle: (
        uuid: string,
        opts?: { instant?: boolean; center?: boolean; focus?: boolean },
      ) => {
        const subtitleElement = document.getElementById(`subtitle-${uuid}`);
        const container = listRef.current;
        if (!subtitleElement || !container) return false;

        // Ensure we are scrolling the correct container
        if (!container.contains(subtitleElement)) return false;

        const behavior: ScrollBehavior = opts?.instant ? "auto" : "smooth";
        const center = opts?.center !== false; // default to true

        const centerElement = () => {
          const cRect = container.getBoundingClientRect();
          const iRect = subtitleElement.getBoundingClientRect();
          // Compute item top relative to container scroll space
          const itemTop = container.scrollTop + (iRect.top - cRect.top);
          const targetTop =
            itemTop - (container.clientHeight - iRect.height) / 2;
          container.scrollTo({ top: Math.max(0, targetTop), behavior });
        };

        if (center) {
          centerElement();
        } else {
          subtitleElement.scrollIntoView({ behavior, block: "nearest" });
        }

        if (opts?.focus) {
          (subtitleElement as HTMLElement).focus({ preventScroll: true });
        }

        // Safety re-center pass after layout settles (handles animated content)
        // Run only for instant jumps where timing is tight (cross-track)
        if (opts?.instant) {
          setTimeout(() => {
            if (!listRef.current) return;
            const stillThere = document.getElementById(`subtitle-${uuid}`);
            if (!stillThere || !listRef.current.contains(stillThere)) return;
            const cRect2 = listRef.current.getBoundingClientRect();
            const iRect2 = stillThere.getBoundingClientRect();
            const centerY = cRect2.top + listRef.current.clientHeight / 2;
            const itemCenterY = iRect2.top + iRect2.height / 2;
            const offBy = Math.abs(itemCenterY - centerY);
            if (offBy > 4) {
              const itemTop2 =
                listRef.current.scrollTop + (iRect2.top - cRect2.top);
              const targetTop2 =
                itemTop2 - (listRef.current.clientHeight - iRect2.height) / 2;
              listRef.current.scrollTo({
                top: Math.max(0, targetTop2),
                behavior: "auto",
              });
            }
          }, 100);
        }

        return true;
      },
    }));

    const handleSrtFileSelect = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = event.target.files?.[0];
      if (!file || !activeTrackId) return;

      const raw = await file.text();
      const lower = file.name.toLowerCase();
      const firstLine =
        raw.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
      const isVtt = lower.endsWith(".vtt") || /^WEBVTT( |$)/.test(firstLine);
      const newSubtitles = isVtt ? parseVTT(raw) : parseSRT(raw);
      loadSubtitlesIntoTrack(activeTrackId, newSubtitles);
      const safe = file.name.replace(/\.(srt|vtt)$/i, "");
      renameTrack(activeTrackId, safe);
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

    const prepareSubtitleInteraction = (uuid: string) => {
      suppressAutoCenterUuidRef.current = uuid;
    };

    const handleSubtitleItemClick = (uuid: string) => {
      suppressAutoCenterUuidRef.current = uuid;
      onScrollToRegion(uuid);
    };

    // Scroll to the current subtitle based on playback time
    useEffect(() => {
      if (!listRef.current) return;

      // Find the current subtitle based on playback time
      const currentSubtitle = subtitles.find(
        (sub) =>
          timeToSeconds(sub.startTime) <= currentTime &&
          timeToSeconds(sub.endTime) > currentTime, // strict end bound to avoid boundary ambiguity
      );

      if (!currentSubtitle) {
        return;
      }

      if (!isPlaying || editingSubtitleUuid) {
        return;
      }

      const currentUuid = currentSubtitle.uuid;

      if (suppressAutoCenterUuidRef.current === currentUuid) {
        activeSubtitleRef.current = currentUuid;
        suppressAutoCenterUuidRef.current = null;
        return;
      }

      if (currentUuid === activeSubtitleRef.current) {
        return;
      }

      // Use uuid for the element ID
      const subtitleElement = document.getElementById(
        `subtitle-${currentUuid}`,
      );
      const container = listRef.current;
      if (subtitleElement && container && container.contains(subtitleElement)) {
        // If it's already near centered, skip extra scroll to avoid fighting cross-track jump
        const cRect = container.getBoundingClientRect();
        const iRect = subtitleElement.getBoundingClientRect();
        const centerY = cRect.top + container.clientHeight / 2;
        const itemCenterY = iRect.top + iRect.height / 2;
        const offBy = Math.abs(itemCenterY - centerY);
        if (offBy > 4) {
          subtitleElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        activeSubtitleRef.current = currentUuid;
      }
    }, [currentTime, subtitles, isPlaying, editingSubtitleUuid]);

    // Keyboard shortcuts effect
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const isEditing =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA");

        // --- Cmd/Ctrl + J/L (jump backward/forward in time) ---
        const applePlatformPattern = /Mac|iPhone|iPad|iPod/i;
        const navigatorUserAgent =
          typeof navigator !== "undefined" ? (navigator.userAgent ?? "") : "";
        const isApplePlatform = applePlatformPattern.test(navigatorUserAgent);
        const jumpModPressed = isApplePlatform ? event.metaKey : event.ctrlKey;

        if (jumpModPressed && (event.key === "j" || event.key === "l")) {
          event.preventDefault();

          // use the jump duration from jumpDuration state
          if (event.key === "j") {
            onTimeJump(-jumpDuration);
          } else if (event.key === "l") {
            onTimeJump(jumpDuration);
          }
        }

        // --- Arrow Keys (Navigate Subtitles) ---
        // This should NOT work when editing
        if (isEditing) {
          return; // Ignore arrow keys if editing
        }

        // --- Shift + Backspace (Merge Previous) ---
        // This should work even when editing
        if (event.shiftKey && event.key === "Backspace") {
          // Find the index of the currently active subtitle (same logic as arrows)
          let currentIndex = subtitles.findIndex(
            (sub) =>
              timeToSeconds(sub.startTime) <= currentTime &&
              timeToSeconds(sub.endTime) > currentTime,
          );

          // If no subtitle is active, find the closest one before the current time
          if (currentIndex === -1) {
            currentIndex = subtitles.findLastIndex(
              (sub) => timeToSeconds(sub.startTime) <= currentTime,
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
              timeToSeconds(sub.endTime) > currentTime, // Use the corrected logic
          );

          // If no subtitle is active, find the closest one before the current time
          if (currentIndex === -1) {
            currentIndex = subtitles.findLastIndex(
              (sub) => timeToSeconds(sub.startTime) <= currentTime,
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
    }, [
      subtitles,
      currentTime,
      setPlaybackTime,
      mergeSubtitlesAction,
      onTimeJump,
      jumpDuration,
    ]); // Add mergeSubtitlesAction dependency

    if (subtitles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-sm">
          <Label className="cursor-pointer text-xl hover:text-blue-500 underline">
            <span>{t("labels.loadSrtFile")}</span>
            <Input
              type="file"
              className="hidden"
              accept=".srt,.vtt"
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
                onScrollToRegion={handleSubtitleItemClick}
                onPrepareSubtitleInteraction={prepareSubtitleInteraction}
                setEditingSubtitleUuid={setEditingSubtitleUuid}
                setIsPlaying={setIsPlaying}
                setPlaybackTime={setPlaybackTime}
              />
            );
          })}
        </AnimatePresence>
      </div>
    );
  },
);

SubtitleList.displayName = "SubtitleList";

export default SubtitleList;
