"use client";

import LanguageSwitcher from "@/components/language-switcher";
import FindReplace from "@/components/find-replace";
import LoadSrt from "@/components/load-srt";
import SaveSrt from "@/components/save-srt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IconArrowBack,
  IconArrowForward,
  IconMovie,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { RefObject } from "react";

interface AppHeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  mediaFileInputRef: RefObject<HTMLInputElement | null>;
  onSelectMediaFile: (file: File) => void;
  mediaFileName: string;
}

export function AppHeader({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  mediaFileInputRef,
  onSelectMediaFile,
  mediaFileName,
}: AppHeaderProps) {
  const t = useTranslations();

  return (
    <nav className="h-[6vh] border-black border-b-2 flex items-center px-12 justify-between">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold mx-4">{t("navigation.title")}</h1>
        <LanguageSwitcher />
        <Link href="/faq" target="_blank" aria-label={t("navigation.faq")}>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            aria-label={t("navigation.faq")}
          >
            <IconQuestionMark size={20} />
          </Button>
        </Link>
      </div>

      <div className="flex gap-4 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canUndo}
                onClick={onUndo}
                className="cursor-pointer"
                aria-label={t("navigation.undo")}
              >
                <IconArrowBack />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("navigation.undo")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canRedo}
                onClick={onRedo}
                className="cursor-pointer"
                aria-label={t("navigation.redo")}
              >
                <IconArrowForward />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("navigation.redo")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <FindReplace />

        <LoadSrt />

        <Label className="cursor-pointer">
          <Input
            ref={mediaFileInputRef}
            type="file"
            className="hidden"
            accept="audio/*,video/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              onSelectMediaFile(file);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              mediaFileInputRef.current?.click();
            }}
            className="bg-sky-300 hover:bg-blue-500 hover:text-white text-black rounded-sm cursor-pointer"
          >
            <IconMovie size={20} />
            <span className="max-w-36 flex-1 overflow-hidden whitespace-nowrap text-ellipsis text-left">
              {mediaFileName}
            </span>
          </Button>
        </Label>

        <SaveSrt />
      </div>
    </nav>
  );
}
