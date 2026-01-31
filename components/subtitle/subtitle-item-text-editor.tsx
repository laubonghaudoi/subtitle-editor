import { Textarea } from "@/components/ui/textarea";
import type { Subtitle } from "@/types/subtitle";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

interface SubtitleTextEditorProps {
  subtitle: Subtitle;
  isEditing: boolean;
  previousSubtitle: Subtitle | null;
  nextSubtitle: Subtitle | null;
  onPrepareSubtitleInteraction: (uuid: string) => void;
  onScrollToRegion: (uuid: string) => void;
  isPlaying: boolean;
  resumePlayback: () => void;
  setIsPlaying: Dispatch<SetStateAction<boolean>>;
  setPlaybackTime: (time: number) => void;
  setEditingSubtitleUuid: Dispatch<SetStateAction<string | null>>;
  resolveStartSeconds: (candidate: Subtitle | null) => number | null;
  startSeconds: number;
  onUpdateText: (id: number, text: string) => void;
  onSplitSubtitle: (
    id: number,
    caretPos: number,
    textLength: number,
    text: string,
  ) => void;
}

export default function SubtitleTextEditor({
  subtitle,
  isEditing,
  previousSubtitle,
  nextSubtitle,
  onPrepareSubtitleInteraction,
  onScrollToRegion,
  isPlaying,
  resumePlayback,
  setIsPlaying,
  setPlaybackTime,
  setEditingSubtitleUuid,
  resolveStartSeconds,
  startSeconds,
  onUpdateText,
  onSplitSubtitle,
}: SubtitleTextEditorProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (isEditing) {
      setEditText(subtitle.text);
      setTimeout(() => {
        textAreaRef.current?.focus();
        textAreaRef.current?.select();
      }, 0);
    }
  }, [isEditing, subtitle.text]);

  if (isEditing) {
    return (
      <Textarea
        className="w-full h-fit bg-blue-300 min-h-0 resize-none rounded-sm focus-visible:outline-none focus-visible:ring-0 shadow-none border-none field-sizing-content"
        rows={1}
        ref={textAreaRef}
        value={editText}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          setEditText(e.target.value);
        }}
        onBlur={() => {
          if (editText !== subtitle.text) {
            onUpdateText(subtitle.id, editText);
          }
          setEditingSubtitleUuid(null);
        }}
        onKeyDown={(e) => {
          if (e.code === "Space" && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            setIsPlaying((previous) => !previous);
            return;
          }

          if (e.key === " ") {
            e.stopPropagation();
          }

          if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === "ArrowUp" || e.key === "ArrowDown")
          ) {
            e.preventDefault();
            const wasPlaying = isPlaying;
            const nextValue = e.currentTarget.value;
            if (nextValue !== subtitle.text) {
              onUpdateText(subtitle.id, nextValue);
            }

            const targetSubtitle =
              e.key === "ArrowUp" ? previousSubtitle : nextSubtitle;

            textAreaRef.current?.blur();
            setEditingSubtitleUuid(null);

            requestAnimationFrame(() => {
              if (targetSubtitle) {
                const targetStartTime =
                  resolveStartSeconds(targetSubtitle) ?? startSeconds;
                onPrepareSubtitleInteraction(targetSubtitle.uuid);
                setPlaybackTime(targetStartTime);
                if (wasPlaying) {
                  setIsPlaying(true);
                  resumePlayback();
                }
                onScrollToRegion(targetSubtitle.uuid);
                setEditingSubtitleUuid(targetSubtitle.uuid);
              } else {
                if (wasPlaying) {
                  setIsPlaying(true);
                  resumePlayback();
                }
                setEditingSubtitleUuid(subtitle.uuid);
              }
            });

            return;
          }

          if (e.key === "Enter") {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const { selectionStart, selectionEnd, value } = e.currentTarget;
              const caretStart = selectionStart ?? editText.length;
              const caretEnd = selectionEnd ?? caretStart;
              const nextValue =
                value.slice(0, caretStart) + "\n" + value.slice(caretEnd);
              setEditText(nextValue);
              requestAnimationFrame(() => {
                const textarea = textAreaRef.current;
                if (textarea) {
                  textarea.setSelectionRange(caretStart + 1, caretStart + 1);
                }
              });
              return;
            }

            e.preventDefault();
            const caretPos = e.currentTarget.selectionStart ?? editText.length;
            const nextText = e.currentTarget.value;

            if (e.shiftKey) {
              onSplitSubtitle(
                subtitle.id,
                caretPos,
                nextText.length,
                nextText,
              );
            } else if (nextText !== subtitle.text) {
              onUpdateText(subtitle.id, nextText);
            }

            setEditingSubtitleUuid(null);
          } else if (e.key === "Escape") {
            e.preventDefault();
            setEditText(subtitle.text);
            setEditingSubtitleUuid(null);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left text-lg px-3 py-2 cursor-pointer whitespace-pre-wrap wrap-break-word"
      tabIndex={0}
      aria-label={
        subtitle.text
          ? `Edit subtitle: ${subtitle.text}`
          : "Edit subtitle (empty)"
      }
      onClick={(event) => {
        if (event.detail === 0) {
          event.stopPropagation();
          event.preventDefault();
        }
        setEditingSubtitleUuid(subtitle.uuid);
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          setEditingSubtitleUuid(subtitle.uuid);
        }
      }}
    >
      {subtitle.text || (
        <span className="text-muted-foreground">(Empty)</span>
      )}
    </button>
  );
}
