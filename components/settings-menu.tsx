"use client";

import SettingsDialog from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconSettings } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SettingsMenu() {
  const t = useTranslations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              aria-label={t("navigation.settings")}
              onClick={() => setIsDialogOpen(true)}
            >
              <IconSettings size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("navigation.settings")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SettingsDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
}
