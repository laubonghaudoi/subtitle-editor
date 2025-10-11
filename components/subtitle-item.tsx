import { IconFold, IconPlus, IconTrash } from "@tabler/icons-react";
import { motion } from "motion/react";
import { memo, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubtitleContext } from "@/context/subtitle-context"; // Import context
import { useToast } from "@/hooks/use-toast";
import { isValidTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useTranslations } from "next-intl";

interface SubtitleItemProps {
  subtitle: Subtitle;
  nextSubtitle: Subtitle | null;
  index: number;
  isLastItem: boolean;
  currentTime: number;
  editingSubtitleUuid: string | null;
  onScrollToRegion: (uuid: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackTime: (time: number) => void;
  setEditingSubtitleUuid: React.Dispatch<React.SetStateAction<string | null>>;
}

const SubtitleItem = memo(function SubtitleItem({
  subtitle,
  nextSubtitle,
  isLastItem,
  currentTime,
  editingSubtitleUuid,
  onScrollToRegion,
  setIsPlaying,
  setPlaybackTime,
  setEditingSubtitleUuid,
}: SubtitleItemProps) {
  const t = useTranslations();
  const {
    updateSubtitleStartTimeAction,
    updateSubtitleEndTimeAction,
    updateSubtitleTextAction,
    mergeSubtitlesAction,
    addSubtitleAction,
    deleteSubtitleAction,
    splitSubtitleAction,
  } = useSubtitleContext();

  const [editingStartTimeId, setEditingStartTimeId] = useState<number | null>(
    null
  );
  const [editStartTime, setEditStartTime] = useState("");
  const [editingEndTimeId, setEditingEndTimeId] = useState<number | null>(null);
  const [editEndTime, setEditEndTime] = useState("");
  const [editText, setEditText] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null); // Ref for this item's textarea

  const { toast } = useToast();

  // Effect to handle focusing the text area when this item is being edited
  useEffect(() => {
    if (editingSubtitleUuid === subtitle.uuid) {
      setEditText(subtitle.text); // Set text when editing starts
      // Focus the textarea
      setTimeout(() => {
        textAreaRef.current?.focus();
        textAreaRef.current?.select(); // Select all text
      }, 0); // Timeout ensures the element is rendered
    } else {
      // Reset local editing states if this item is no longer being edited
      setEditingStartTimeId(null);
      setEditingEndTimeId(null);
      // Don't reset editText here, it's handled onBlur/Enter/Escape
    }
  }, [editingSubtitleUuid, subtitle.uuid, subtitle.text]);

  const handleTimeUpdate = (
    id: number,
    newTime: string,
    // Replace updateFunction prop with context action
    updateAction: (id: number, newTime: string) => void,
    setEditingId: (id: number | null) => void,
    isStartTime = false
  ) => {
    if (!isValidTime(newTime)) {
      toast({
        title: t("validation.invalidTimeTitle"),
        description: t("validation.invalidTimeDescription"),
        className: "border-0 bg-orange-200 text-red-700",
      });
      setEditingId(null);
      return;
    }

    const newTimeInSeconds = timeToSeconds(newTime);

    if (isStartTime) {
      if (newTimeInSeconds > timeToSeconds(subtitle.endTime)) {
        toast({
          title: t("validation.invalidStartTitle"),
          description: t("validation.invalidStartDescription"),
          className: "border-0 bg-orange-200 text-red-700",
        });
        setEditingId(null);
        return;
      }
    } else {
      if (newTimeInSeconds < timeToSeconds(subtitle.startTime)) {
        toast({
          title: t("validation.invalidEndTitle"),
          description: t("validation.invalidEndDescription"),
          className: "border-0 bg-orange-200 text-red-700",
        });
        setEditingId(null);
        return;
      }
    }

    updateAction(id, newTime); // Call context action
    setEditingId(null);
  };

  // Calculate if the add button should be disabled
  let isAddDisabled = false;
  let addTooltipContent = t("tooltips.add");
  if (!isLastItem && nextSubtitle) {
    const currentEndTimeSec = timeToSeconds(subtitle.endTime);
    const nextStartTimeSec = timeToSeconds(nextSubtitle.startTime);
    const timeDiff = nextStartTimeSec - currentEndTimeSec;
    isAddDisabled = timeDiff <= 0.001;
    if (isAddDisabled) {
      addTooltipContent = t("tooltips.noRoom");
    }
  }

  return (
    <motion.div
      key={subtitle.uuid} // Use UUID for stable key
      initial={{ opacity: 0, height: 0 }} // Keep height animation
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.1 }}
    >
      <TooltipProvider>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Interactive div */}
        <div
          id={`subtitle-${subtitle.uuid}`}
          tabIndex={-1}
          onClick={() => onScrollToRegion(subtitle.uuid)}
          onFocus={() => {
            setPlaybackTime(timeToSeconds(subtitle.startTime));
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              setPlaybackTime(timeToSeconds(subtitle.startTime));
              setIsPlaying(true);
            }
          }}
          className={`px-4 py-2 border-b border-gray-800 hover:bg-amber-50 cursor-pointer grid grid-cols-[1rem_7rem_1fr] gap-4 items-center ${
            timeToSeconds(subtitle.startTime) <= currentTime &&
            timeToSeconds(subtitle.endTime) > currentTime
              ? "bg-cyan-50"
              : ""
          }`}
        >
          {/* Subtitle ID */}
          <div className="text-sm text-muted-foreground font-mono">
            {subtitle.id}
          </div>

          {/* Subtitle start and end time */}
          <div className="text-sm text-muted-foreground flex flex-col gap-0">
            {editingStartTimeId === subtitle.id ? (
              <Input
                ref={(input) => {
                  if (input) input.focus();
                }}
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                onBlur={() =>
                  handleTimeUpdate(
                    subtitle.id,
                    editStartTime,
                    updateSubtitleStartTimeAction,
                    setEditingStartTimeId,
                    true // Indicate it's the start time
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTimeUpdate(
                      subtitle.id,
                      editStartTime,
                      updateSubtitleStartTimeAction,
                      setEditingStartTimeId,
                      true // Indicate it's the start time
                    );
                  } else if (e.key === "Escape") {
                    setEditingStartTimeId(null);
                  }
                }}
                className="p-0 w-26 h-8 text-center text-black"
              />
            ) : (
              <Button
                tabIndex={0}
                onClick={() => {
                  setEditingStartTimeId(subtitle.id);
                  setEditStartTime(subtitle.startTime);
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setEditingStartTimeId(subtitle.id);
                    setEditStartTime(subtitle.startTime);
                  }
                }}
                variant="ghost"
                className="hover:bg-transparent h-8 cursor-pointer"
              >
                {subtitle.startTime}
              </Button>
            )}

            {editingEndTimeId === subtitle.id ? (
              <Input
                ref={(input) => {
                  if (input) input.focus();
                }}
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                onBlur={() =>
                  handleTimeUpdate(
                    subtitle.id,
                    editEndTime,
                    updateSubtitleEndTimeAction,
                    setEditingEndTimeId,
                    false // Indicate it's the end time
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTimeUpdate(
                      subtitle.id,
                      editEndTime,
                      updateSubtitleEndTimeAction,
                      setEditingEndTimeId,
                      false // Indicate it's the end time
                    );
                  } else if (e.key === "Escape") {
                    setEditingEndTimeId(null);
                  }
                }}
                className="p-0 w-26 h-8 text-center text-black"
              />
            ) : (
              <Button
                tabIndex={0}
                onClick={() => {
                  setEditingEndTimeId(subtitle.id);
                  setEditEndTime(subtitle.endTime);
                }}
                onKeyUp={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setEditingEndTimeId(subtitle.id);
                    setEditEndTime(subtitle.endTime);
                  }
                }}
                variant="ghost"
                className="hover:bg-transparent h-8 cursor-pointer"
              >
                {subtitle.endTime}
              </Button>
            )}
          </div>

          {/* Subtitle text */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              {editingSubtitleUuid === subtitle.uuid ? (
                <Textarea
                  className="w-full px-2 h-4" // Adjust height as needed
                  ref={textAreaRef} // Assign ref
                  value={editText}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => {
                    // Only update if text actually changed to avoid unnecessary history steps
                    if (editText !== subtitle.text) {
                      updateSubtitleTextAction(subtitle.id, editText);
                    }
                    setEditingSubtitleUuid(null); // Exit edit mode
                  }}
                  onKeyDown={(e) => {
                    // Stop space key propagation when editing
                    if (e.key === " ") {
                      e.stopPropagation();
                    }

                    // Handle normal Enter key to confirm edit
                    if (e.key === "Enter") {
                      e.preventDefault(); // Prevent default newline behavior
                      if (editText !== subtitle.text) {
                        updateSubtitleTextAction(subtitle.id, editText);
                      }

                      // Check SHIFT + ENTER for split
                      if (e.shiftKey) {
                        const caretPos = e.currentTarget.selectionStart;
                        const totalLen = e.currentTarget.value.length;
                        splitSubtitleAction(subtitle.id, caretPos, totalLen);
                      }

                      setEditingSubtitleUuid(null); // Exit edit mode
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      // Cancel edit: Reset text and exit edit mode
                      setEditText(subtitle.text); // Revert to original text
                      setEditingSubtitleUuid(null); // Exit edit mode
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="w-full text-left text-lg cursor-pointer whitespace-pre-wrap break-words"
                  tabIndex={0}
                  aria-label={subtitle.text ? `Edit subtitle: ${subtitle.text}` : "Edit subtitle (empty)"}
                  onClick={() => {
                    setEditingSubtitleUuid(subtitle.uuid);
                  }}
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setEditingSubtitleUuid(subtitle.uuid);
                    }
                  }}
                >
                  {subtitle.text || (
                    <span className="text-muted-foreground">(Empty)</span>
                  )}
                </button>
              )}
            </div>

            {/* Delete button */}

            <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() => deleteSubtitleAction(subtitle.id)}
              className="mx-4 my-auto px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded cursor-pointer"
              aria-label={t("tooltips.delete")}
            >
              <IconTrash size={16} />
            </TooltipTrigger>
              <TooltipContent className="bg-red-600 px-2 py-1 text-sm">
                {t("tooltips.delete")}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Merge and add button */}
        <div className="flex justify-center gap-16 -mt-3 -mb-3">
          {!isLastItem && nextSubtitle && (
            <Tooltip>
            <TooltipTrigger
              type="button"
              onClick={() =>
                mergeSubtitlesAction(subtitle.id, nextSubtitle.id)
              }
              className="px-2 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded cursor-pointer"
              aria-label={t("tooltips.merge")}
            >
              <IconFold size={16} />
            </TooltipTrigger>
              <TooltipContent className="bg-amber-500 px-2 py-1 text-sm">
                {t("tooltips.merge")}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              type="button"
              disabled={isAddDisabled}
              onClick={() => {
                if (!isAddDisabled) {
                  addSubtitleAction(
                    subtitle.id,
                    !isLastItem && nextSubtitle ? nextSubtitle.id : null,
                    t("subtitle.newSubtitle")
                  );
                }
              }}
              className={`px-2 py-1 text-sm rounded ${
                isAddDisabled
                  ? "bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer"
              }`}
              aria-label={
                isAddDisabled ? t("tooltips.noRoom") : t("tooltips.add")
              }
            >
              <IconPlus size={16} />
            </TooltipTrigger>
            <TooltipContent
              className={`px-2 py-1 text-sm ${
                isAddDisabled ? "bg-gray-500" : "bg-green-500"
              }`}
            >
              {addTooltipContent}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </motion.div>
  );
});

export default SubtitleItem;
