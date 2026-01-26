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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSubtitleState } from "@/context/subtitle-context";
import { IconMoon, IconSun } from "@tabler/icons-react";
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
  const { clampOverlaps, setClampOverlaps } = useSubtitleState();
  const overlapClampId = useId();

  useEffect(() => {
    setIsThemeMounted(true);
  }, []);

  const themeValue = isThemeMounted ? (resolvedTheme ?? "") : "";

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
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={themeValue}
              aria-label={t("dialog.themeLabel")}
              disabled={!isThemeMounted}
              onValueChange={(value) => {
                if (value === "light" || value === "dark") {
                  setTheme(value);
                }
              }}
            >
              <ToggleGroupItem
                value="light"
                className="cursor-pointer bg-white text-black hover:bg-neutral-100 data-[state=on]:bg-white data-[state=on]:text-black border-none dark:bg-white dark:text-black dark:hover:bg-neutral-100"
              >
                <IconSun size={16} />
                {t("dialog.themeLight")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dark"
                className="cursor-pointer border-neutral-900 bg-neutral-900 text-white hover:text-white hover:bg-neutral-800 data-[state=on]:bg-neutral-900 data-[state=on]:text-white dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:data-[state=on]:bg-neutral-950"
              >
                <IconMoon size={16} />
                {t("dialog.themeDark")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-start justify-between gap-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
