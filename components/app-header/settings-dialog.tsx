"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSubtitleState } from "@/context/subtitle-context";
import { cn } from "@/lib/utils";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const t = useTranslations();
  const { resolvedTheme, setTheme } = useTheme();
  const [isThemeMounted, setIsThemeMounted] = useState(false);
  const {
    clampOverlaps,
    setClampOverlaps,
    showSubtitleDuration,
    setShowSubtitleDuration,
    addSpaceOnMerge,
    setAddSpaceOnMerge,
    playInBackground,
    setPlayInBackground,
  } = useSubtitleState();
  const overlapClampId = useId();
  const subtitleDurationId = useId();
  const addSpaceOnMergeId = useId();
  const playInBackgroundId = useId();

  useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  const themeValue = isThemeMounted ? (resolvedTheme ?? "") : "";
  const activeTheme = themeValue === "dark" ? "dark" : "light";
  const themeOptions = [
    {
      value: "light",
      label: t("dialog.themeLight"),
      icon: IconSun,
    },
    {
      value: "dark",
      label: t("dialog.themeDark"),
      icon: IconMoon,
    },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog.settingsTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialog.settingsDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm">{t("dialog.themeLabel")}</Label>
            <div
              className="relative grid grid-cols-2 rounded-lg border border-black/10 bg-neutral-100 p-0.5 dark:border-white/10 dark:bg-neutral-900"
              role="tablist"
              aria-label={t("dialog.themeLabel")}
            >
              {isThemeMounted ? (
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)] rounded-md bg-white shadow-sm dark:bg-neutral-950"
                  animate={{ x: activeTheme === "dark" ? "100%" : "0%" }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}

              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = activeTheme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    disabled={!isThemeMounted}
                    className={cn(
                      "relative z-10 inline-flex min-w-[6.25rem] items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setTheme(option.value)}
                  >
                    <Icon size={16} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor={overlapClampId} className="text-sm">
                {t("dialog.overlapClampLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("dialog.overlapClampDescription")}
              </p>
            </div>
            <Switch
              id={overlapClampId}
              checked={clampOverlaps}
              onCheckedChange={(value) => setClampOverlaps(value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor={subtitleDurationId} className="text-sm">
                {t("dialog.subtitleDurationLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("dialog.subtitleDurationDescription")}
              </p>
            </div>
            <Switch
              id={subtitleDurationId}
              checked={showSubtitleDuration}
              onCheckedChange={(value) => setShowSubtitleDuration(value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor={addSpaceOnMergeId} className="text-sm">
                {t("dialog.addSpaceOnMergeLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("dialog.addSpaceOnMergeDescription")}
              </p>
            </div>
            <Switch
              id={addSpaceOnMergeId}
              checked={addSpaceOnMerge}
              onCheckedChange={(value) => setAddSpaceOnMerge(value)}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor={playInBackgroundId} className="text-sm">
                {t("dialog.playInBackgroundLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("dialog.playInBackgroundDescription")}
              </p>
            </div>
            <Switch
              id={playInBackgroundId}
              checked={playInBackground}
              onCheckedChange={(value) => setPlayInBackground(value)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
