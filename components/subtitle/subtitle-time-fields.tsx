import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isValidTime, timeToSeconds } from "@/lib/utils";
import type { Subtitle } from "@/types/subtitle";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface SubtitleTimeFieldsProps {
  subtitle: Subtitle;
  startSeconds: number;
  endSeconds: number;
  editingSubtitleUuid: string | null;
  onUpdateStartTime: (id: number, newTime: string) => void;
  onUpdateEndTime: (id: number, newTime: string) => void;
}

export default function SubtitleTimeFields({
  subtitle,
  startSeconds,
  endSeconds,
  editingSubtitleUuid,
  onUpdateStartTime,
  onUpdateEndTime,
}: SubtitleTimeFieldsProps) {
  const t = useTranslations();
  const { toast } = useToast();
  const [editingStartTimeId, setEditingStartTimeId] = useState<number | null>(
    null,
  );
  const [editStartTime, setEditStartTime] = useState("");
  const [editingEndTimeId, setEditingEndTimeId] = useState<number | null>(null);
  const [editEndTime, setEditEndTime] = useState("");

  useEffect(() => {
    if (editingSubtitleUuid !== subtitle.uuid) {
      setEditingStartTimeId(null);
      setEditingEndTimeId(null);
    }
  }, [editingSubtitleUuid, subtitle.uuid]);

  const handleTimeUpdate = (
    id: number,
    newTime: string,
    updateAction: (id: number, newTime: string) => void,
    setEditingId: (id: number | null) => void,
    isStartTime = false,
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
      if (newTimeInSeconds > endSeconds) {
        toast({
          title: t("validation.invalidStartTitle"),
          description: t("validation.invalidStartDescription"),
          className: "border-0 bg-orange-200 text-red-700",
        });
        setEditingId(null);
        return;
      }
    } else {
      if (newTimeInSeconds < startSeconds) {
        toast({
          title: t("validation.invalidEndTitle"),
          description: t("validation.invalidEndDescription"),
          className: "border-0 bg-orange-200 text-red-700",
        });
        setEditingId(null);
        return;
      }
    }

    updateAction(id, newTime);
    setEditingId(null);
  };

  return (
    <div className="text-sm flex flex-col gap-1">
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
              onUpdateStartTime,
              setEditingStartTimeId,
              true,
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleTimeUpdate(
                subtitle.id,
                editStartTime,
                onUpdateStartTime,
                setEditingStartTimeId,
                true,
              );
            } else if (e.key === "Escape") {
              setEditingStartTimeId(null);
            }
          }}
          className="py-1 bg-blue-300 h-fit text-center text-sm min-h-0 resize-none rounded-xs focus-visible:outline-none focus-visible:ring-0 shadow-none border-none"
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
          className="text-sm hover:bg-transparent h-fit cursor-pointer py-1"
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
              onUpdateEndTime,
              setEditingEndTimeId,
              false,
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleTimeUpdate(
                subtitle.id,
                editEndTime,
                onUpdateEndTime,
                setEditingEndTimeId,
                false,
              );
            } else if (e.key === "Escape") {
              setEditingEndTimeId(null);
            }
          }}
          className="py-1 bg-blue-300 h-fit min-h-0 text-center text-sm resize-none rounded-xs focus-visible:outline-none focus-visible:ring-0 shadow-none border-none"
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
          className="hover:bg-transparent h-fit cursor-pointer py-1 text-sm"
        >
          {subtitle.endTime}
        </Button>
      )}
    </div>
  );
}
