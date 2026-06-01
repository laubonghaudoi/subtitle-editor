import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface SubtitleItemDeleteButtonProps {
  onDelete: () => void;
}

export default function SubtitleItemDeleteButton({
  onDelete,
}: SubtitleItemDeleteButtonProps) {
  const t = useTranslations();

  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        onClick={onDelete}
        className="mx-4 my-auto px-2 py-1 text-sm rounded-xs ring-1 ring-inset ring-red-800 bg-red-200 hover:bg-red-300 text-[color:var(--red-11)] cursor-pointer"
        aria-label={t("tooltips.delete")}
      >
        <IconTrash size={16} />
      </TooltipTrigger>
      <TooltipContent className="bg-red-900 text-black px-2 py-1 text-sm">
        {t("tooltips.delete")}
      </TooltipContent>
    </Tooltip>
  );
}
