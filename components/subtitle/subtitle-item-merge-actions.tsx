import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Subtitle } from "@/types/subtitle";
import { IconFold, IconPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface SubtitleItemMergeActionsProps {
  subtitle: Subtitle;
  nextSubtitle: Subtitle | null;
  isLastItem: boolean;
  nextStartSeconds: number | null;
  endSeconds: number;
  onMerge: (currentId: number, nextId: number) => void;
  onAdd: (currentId: number, nextId: number | null, text: string) => void;
}

export default function SubtitleItemMergeActions({
  subtitle,
  nextSubtitle,
  isLastItem,
  nextStartSeconds,
  endSeconds,
  onMerge,
  onAdd,
}: SubtitleItemMergeActionsProps) {
  const t = useTranslations();

  let isAddDisabled = false;
  let addTooltipContent = t("tooltips.add");
  if (!isLastItem && nextSubtitle && nextStartSeconds !== null) {
    const timeDiff = nextStartSeconds - endSeconds;
    isAddDisabled = timeDiff <= 0.001;
    if (isAddDisabled) {
      addTooltipContent = t("tooltips.noRoom");
    }
  }

  return (
    <div className="flex justify-center gap-16 -mt-3 -mb-3">
      {!isLastItem && nextSubtitle && (
        <Tooltip>
          <TooltipTrigger
            type="button"
            onClick={() => onMerge(subtitle.id, nextSubtitle.id)}
            className="px-2 py-1 text-xs rounded-xs ring-1 ring-inset ring-amber-700 bg-amber-200 hover:bg-amber-300 text-[color:var(--amber-11)] cursor-pointer"
            aria-label={t("tooltips.merge")}
          >
            <IconFold size={16} />
          </TooltipTrigger>
          <TooltipContent className="bg-amber-900 dark:bg-amber-800 text-black px-2 py-1 text-sm">
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
              onAdd(
                subtitle.id,
                !isLastItem && nextSubtitle ? nextSubtitle.id : null,
                t("subtitle.newSubtitle"),
              );
            }
          }}
          className={`px-2 py-1 text-sm rounded-xs ${
            isAddDisabled
              ? "ring-1 ring-inset ring-slate-700 bg-slate-200 text-slate-900 cursor-not-allowed"
              : "ring-1 ring-inset ring-green-800 bg-green-200 hover:bg-green-300 text-[color:var(--green-11)] cursor-pointer"
          }`}
          aria-label={
            isAddDisabled ? t("tooltips.noRoom") : t("tooltips.add")
          }
        >
          <IconPlus size={16} />
        </TooltipTrigger>
        <TooltipContent
          className={`px-2 py-1 text-sm ${
            isAddDisabled ? "" : "bg-green-800 text-black"
          }`}
        >
          {addTooltipContent}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
