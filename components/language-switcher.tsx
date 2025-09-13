"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconLanguage } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { locales, localeConfig } from "@/lib/locales";
import { useSubtitleContext } from "@/context/subtitle-context";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { canUndoSubtitles } = useSubtitleContext();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [targetHref, setTargetHref] = useState<string>("");

  // Function to get the path for a different locale
  const getLocalizedPath = (targetLocale: string) => {
    if (targetLocale === "en") {
      return "/";
    } else {
      return `/${targetLocale}`;
    }
  };

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (canUndoSubtitles) {
      e.preventDefault();
      setTargetHref(href);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmNavigation = () => {
    setShowConfirmDialog(false);
    router.push(targetHref);
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setTargetHref("");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="cursor-pointer">
            <IconLanguage />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="shadow-none p-0 rounded-xs border-neutral-800 border-1">
          {locales.map((loc) => {
            const href = getLocalizedPath(loc);
            return (
              <DropdownMenuItem key={loc} asChild>
                <Link
                  href={href}
                  onClick={(e) => handleLinkClick(e, href)}
                  className={
                    locale === loc
                      ? "bg-accent cursor-pointer"
                      : "cursor-pointer"
                  }
                >
                  {localeConfig[loc].nativeName}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.switchTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.switchDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelNavigation}
              className="cursor-pointer"
            >
              {t("dialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 cursor-pointer"
              onClick={handleConfirmNavigation}
            >
              {t("dialog.yes")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
