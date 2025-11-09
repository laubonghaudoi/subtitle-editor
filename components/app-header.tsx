"use client";

import FindReplace from "@/components/find-replace";
import LanguageSwitcher from "@/components/language-switcher";
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
  IconAdjustmentsHorizontal,
  IconArrowBack,
  IconArrowForward,
  IconBrandGithub,
  IconBrightness,
  IconMovie,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState, type RefObject } from "react";
import { useSubtitleContext } from "@/context/subtitle-context";
import { getTrackHandleColor } from "@/lib/track-colors";
import type { SubtitleTrack } from "@/types/subtitle";
import { useTheme } from "next-themes";

function getBulkButtonColors(
  tracks: SubtitleTrack[],
  activeTrackId: string | null,
) {
  const index = tracks.findIndex((track) => track.id === activeTrackId);
  if (index < 0) {
    return {
      bulkColor: "#334155",
      bulkTextColor: "#ffffff",
      bulkOutlineColor: "#0f172a",
    };
  }
  const base = getTrackHandleColor(index);
  return {
    bulkColor: base,
    bulkTextColor: "#ffffff",
    bulkOutlineColor: base,
  };
}

interface AppHeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  mediaFileInputRef: RefObject<HTMLInputElement | null>;
  onSelectMediaFile: (file: File) => void;
  mediaFileName: string;
  isBulkOffsetOpen: boolean;
  onToggleBulkOffset: () => void;
  bulkOffsetDisabled: boolean;
}

export function AppHeader({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  mediaFileInputRef,
  onSelectMediaFile,
  mediaFileName,
  isBulkOffsetOpen,
  onToggleBulkOffset,
  bulkOffsetDisabled,
}: AppHeaderProps) {
  const t = useTranslations();
  const { tracks, activeTrackId } = useSubtitleContext();
  const { resolvedTheme, setTheme } = useTheme();
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const { bulkColor, bulkTextColor, bulkOutlineColor } = getBulkButtonColors(
    tracks,
    activeTrackId ?? null,
  );
  const bulkButtonStyle = isBulkOffsetOpen
    ? {
        backgroundColor: bulkColor,
        color: bulkTextColor,
        borderColor: bulkOutlineColor,
      }
    : undefined;

  useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  const handleToggleTheme = () => {
    if (!isThemeMounted) {
      return;
    }
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDarkMode = isThemeMounted && resolvedTheme === "dark";

  return (
    <nav className="h-[6vh] border-b-2 border-black dark:border-white flex items-center px-12 justify-between">
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
        <Link
          href="https://github.com/laubonghaudoi/subtitle-editor"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("navigation.github")}
        >
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            aria-label={t("navigation.github")}
          >
            <IconBrandGithub size={20} />
          </Button>
        </Link>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleToggleTheme}
          className="cursor-pointer"
          aria-label={t("navigation.toggleTheme")}
          aria-pressed={isDarkMode}
          disabled={!isThemeMounted}
        >
          <IconBrightness size={20} />
        </Button>
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="default"
                variant="outline"
                onClick={onToggleBulkOffset}
                disabled={bulkOffsetDisabled}
                className="flex items-center rounded-xs shadow-none border-black dark:border-white"
                style={bulkButtonStyle}
                aria-pressed={isBulkOffsetOpen}
              >
                <IconAdjustmentsHorizontal />
                <span className="hidden sm:inline">
                  {t("navigation.bulkOffset")}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              style={{
                backgroundColor: bulkColor,
                borderColor: bulkColor,
                color: "#fff",
              }}
            >
              {isBulkOffsetOpen
                ? t("navigation.hideBulkOffset")
                : t("navigation.showBulkOffset")}
            </TooltipContent>
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
            className="bg-sky-300 hover:bg-blue-500 dark:bg-sky-500 dark:hover:bg-blue-400 hover:text-white text-black rounded-sm cursor-pointer"
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
