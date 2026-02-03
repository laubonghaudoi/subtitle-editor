import { TooltipProvider } from "@/components/ui/tooltip";
import {
  useSubtitleActionsContext,
  useSubtitleState,
  useSubtitleTimings,
} from "@/context/subtitle-context";
import { timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import SubtitleItemDeleteButton from "./subtitle-item-delete-button";
import SubtitleItemMergeActions from "./subtitle-item-merge-actions";
import SubtitleTextEditor from "./subtitle-item-text-editor";
import SubtitleTimeFields from "./subtitle-time-fields";

interface SubtitleItemProps {
  subtitle: Subtitle;
  nextSubtitle: Subtitle | null;
  previousSubtitle: Subtitle | null;
  isLastItem: boolean;
  currentTime: number;
  editingSubtitleUuid: string | null;
  onScrollToRegion: (uuid: string) => void;
  isPlaying: boolean;
  resumePlayback: () => void;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaybackTime: (time: number) => void;
  setEditingSubtitleUuid: React.Dispatch<React.SetStateAction<string | null>>;
  onPrepareSubtitleInteraction: (uuid: string) => void;
}

const SubtitleItem = memo(function SubtitleItem({
  subtitle,
  nextSubtitle,
  previousSubtitle,
  isLastItem,
  currentTime,
  editingSubtitleUuid,
  onScrollToRegion,
  isPlaying,
  resumePlayback,
  setIsPlaying,
  setPlaybackTime,
  setEditingSubtitleUuid,
  onPrepareSubtitleInteraction,
}: SubtitleItemProps) {
  const {
    updateSubtitleStartTimeAction,
    updateSubtitleEndTimeAction,
    updateSubtitleTextAction,
    mergeSubtitlesAction,
    addSubtitleAction,
    deleteSubtitleAction,
    splitSubtitleAction,
  } = useSubtitleActionsContext();
  const { byUuid: subtitleTimingMap } = useSubtitleTimings();
  const { showSubtitleDuration } = useSubtitleState();
  const t = useTranslations();

  const resolveStartSeconds = (candidate: Subtitle | null) => {
    if (!candidate) {
      return null;
    }
    const entry = subtitleTimingMap.get(candidate.uuid);
    return entry ? entry.start : timeToSeconds(candidate.startTime);
  };

  const resolveEndSeconds = (candidate: Subtitle | null) => {
    if (!candidate) {
      return null;
    }
    const entry = subtitleTimingMap.get(candidate.uuid);
    return entry ? entry.end : timeToSeconds(candidate.endTime);
  };

  const startSeconds = resolveStartSeconds(subtitle) ?? 0;
  const endSeconds = resolveEndSeconds(subtitle) ?? startSeconds;
  const nextStartSeconds = resolveStartSeconds(nextSubtitle);
  const durationSeconds = Math.max(0, endSeconds - startSeconds);
  const durationLabel = `${durationSeconds.toFixed(3)}s`;
  const trimmedText = subtitle.text.trim();
  const wordCount =
    trimmedText.length > 0 ? trimmedText.split(/\s+/).length : 0;
  const characterCount = Array.from(subtitle.text).length;

  const isEditing = editingSubtitleUuid === subtitle.uuid;

  return (
    <motion.div
      key={subtitle.uuid}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.1 }}
    >
      <TooltipProvider>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive div */}
        <div
          id={`subtitle-${subtitle.uuid}`}
          tabIndex={-1}
          onPointerDown={() => onPrepareSubtitleInteraction(subtitle.uuid)}
          onClick={() => onScrollToRegion(subtitle.uuid)}
          onFocus={() => {
            if (isPlaying) {
              return;
            }
            setPlaybackTime(startSeconds);
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              setPlaybackTime(startSeconds);
              setIsPlaying(true);
              resumePlayback();
            }
          }}
          className={`px-4 py-2 border-b border-black dark:border-white hover:bg-yellow-200 cursor-pointer grid gap-4 items-center ${
            startSeconds <= currentTime && endSeconds > currentTime
              ? "bg-sky-400"
              : ""
          } ${
            showSubtitleDuration
              ? "grid-cols-[1rem_7rem_5rem_1fr]"
              : "grid-cols-[1rem_7rem_1fr]"
          }`}
        >
          <div className="text-sm font-mono">{subtitle.id}</div>

          <SubtitleTimeFields
            subtitle={subtitle}
            startSeconds={startSeconds}
            endSeconds={endSeconds}
            editingSubtitleUuid={editingSubtitleUuid}
            onUpdateStartTime={updateSubtitleStartTimeAction}
            onUpdateEndTime={updateSubtitleEndTimeAction}
          />

          {showSubtitleDuration ? (
            <div className="flex flex-col justify-between text-sm text-gray-900 font-mono tabular-nums text-center">
              <p>{durationLabel}</p>
              <p>
                {wordCount}
                {t("subtitleStats.wordUnit")}
              </p>
              <p>
                {characterCount}
                {t("subtitleStats.charUnit")}
              </p>
            </div>
          ) : null}

          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <SubtitleTextEditor
                subtitle={subtitle}
                isEditing={isEditing}
                previousSubtitle={previousSubtitle}
                nextSubtitle={nextSubtitle}
                onPrepareSubtitleInteraction={onPrepareSubtitleInteraction}
                onScrollToRegion={onScrollToRegion}
                isPlaying={isPlaying}
                resumePlayback={resumePlayback}
                setIsPlaying={setIsPlaying}
                setPlaybackTime={setPlaybackTime}
                setEditingSubtitleUuid={setEditingSubtitleUuid}
                resolveStartSeconds={resolveStartSeconds}
                startSeconds={startSeconds}
                onUpdateText={updateSubtitleTextAction}
                onSplitSubtitle={splitSubtitleAction}
              />
            </div>

            <SubtitleItemDeleteButton
              onDelete={() => deleteSubtitleAction(subtitle.id)}
            />
          </div>
        </div>

        <SubtitleItemMergeActions
          subtitle={subtitle}
          nextSubtitle={nextSubtitle}
          isLastItem={isLastItem}
          nextStartSeconds={nextStartSeconds}
          endSeconds={endSeconds}
          onMerge={mergeSubtitlesAction}
          onAdd={addSubtitleAction}
        />
      </TooltipProvider>
    </motion.div>
  );
});

export default SubtitleItem;
