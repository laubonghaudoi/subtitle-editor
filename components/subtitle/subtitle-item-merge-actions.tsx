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
            className="px-2 py-1 text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 dark:bg-amber-800 dark:hover:bg-amber-900 dark:text-amber-700 rounded cursor-pointer"
            aria-label={t("tooltips.merge")}
          >
            <IconFold size={16} />
          </TooltipTrigger>
          <TooltipContent className="bg-amber-900 dark:bg-amber-800 px-2 py-1 text-sm">
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
          className={`px-2 py-1 text-sm rounded ${
            isAddDisabled
              ? "bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover-gray dark:text-gray-200 cursor-not-allowed"
              : "bg-grass-300 hover:bg-grass-400 text-grass-800 dark:bg-grass-800 dark:hover:bg-grass-900 dark:text-grass-300 cursor-pointer"
          }`}
          aria-label={
            isAddDisabled ? t("tooltips.noRoom") : t("tooltips.add")
          }
        >
          <IconPlus size={16} />
        </TooltipTrigger>
        <TooltipContent
          className={`px-2 py-1 text-sm ${
            isAddDisabled ? "bg-gray-800 dark:text-white" : "bg-grass-800"
          }`}
        >
          {addTooltipContent}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
