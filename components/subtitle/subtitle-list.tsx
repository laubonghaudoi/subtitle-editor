import {
  useSubtitleActionsContext,
  useSubtitles,
  useSubtitleState,
  useSubtitleTimings,
} from "@/context/subtitle-context";
import { parseSRT, parseVTT } from "@/lib/subtitle-operations";
import type { Subtitle } from "@/types/subtitle";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { v4 as uuidv4 } from "uuid";
import SubtitleItem from "./subtitle-item";
import SubtitleListEmpty from "./subtitle-list-empty";
import { useSubtitleAutoScroll } from "./use-subtitle-auto-scroll";
import { useSubtitleListShortcuts } from "./use-subtitle-list-shortcuts";

interface SubtitleListProps {
  currentTime?: number;
  isPlaying: boolean;
  onScrollToRegion: (uuid: string) => void;
  resumePlayback: () => void;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setPlaybackTime: (time: number) => void;
  editingSubtitleUuid: string | null;
  setEditingSubtitleUuid: React.Dispatch<React.SetStateAction<string | null>>;
  onTimeJump: (seconds: number) => void;
  jumpDuration: number;
}

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
      resumePlayback,
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
    const manualScrollRequestUuidRef = useRef<string | null>(null);
    const subtitles = useSubtitles();
    const {
      mergeSubtitlesAction,
      loadSubtitlesIntoTrack,
      renameTrack,
      deleteSubtitleAction,
    } = useSubtitleActionsContext();
    const { activeTrackId } = useSubtitleState();
    const { list: subtitleTimings } = useSubtitleTimings();

    useSubtitleAutoScroll({
      listRef,
      subtitles,
      subtitleTimings,
      currentTime,
      isPlaying,
      editingSubtitleUuid,
      activeSubtitleRef,
      suppressAutoCenterUuidRef,
      manualScrollRequestUuidRef,
    });

    useSubtitleListShortcuts({
      subtitles,
      subtitleTimings,
      currentTime,
      jumpDuration,
      onTimeJump,
      setPlaybackTime,
      mergeSubtitlesAction,
      deleteSubtitleAction,
      manualScrollRequestUuidRef,
    });

    useImperativeHandle(ref, () => ({
      scrollToSubtitle: (
        uuid: string,
        opts?: { instant?: boolean; center?: boolean; focus?: boolean },
      ) => {
        const subtitleElement = document.getElementById(`subtitle-${uuid}`);
        const container = listRef.current;
        if (!subtitleElement || !container) return false;

        if (!container.contains(subtitleElement)) return false;

        const behavior: ScrollBehavior = opts?.instant ? "auto" : "smooth";
        const center = opts?.center !== false;

        const centerElement = () => {
          const cRect = container.getBoundingClientRect();
          const iRect = subtitleElement.getBoundingClientRect();
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

    if (subtitles.length === 0) {
      return (
        <SubtitleListEmpty
          onFileSelect={handleSrtFileSelect}
          onStartFromScratch={handleStartFromScratch}
        />
      );
    }

    return (
      <div ref={listRef} className="h-full overflow-y-scroll">
        <AnimatePresence>
          {subtitles.map((subtitle: Subtitle, index: number) => {
            const isLastItem = index === subtitles.length - 1;
            const nextSubtitle = isLastItem ? null : subtitles[index + 1];
            const previousSubtitle = index === 0 ? null : subtitles[index - 1];
            return (
              <SubtitleItem
                key={subtitle.uuid}
                subtitle={subtitle}
                nextSubtitle={nextSubtitle}
                previousSubtitle={previousSubtitle}
                isLastItem={isLastItem}
                currentTime={currentTime}
                isPlaying={isPlaying}
                editingSubtitleUuid={editingSubtitleUuid}
                onScrollToRegion={handleSubtitleItemClick}
                onPrepareSubtitleInteraction={prepareSubtitleInteraction}
                setEditingSubtitleUuid={setEditingSubtitleUuid}
                resumePlayback={resumePlayback}
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
