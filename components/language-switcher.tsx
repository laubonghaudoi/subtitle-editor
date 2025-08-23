"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconLanguage } from "@tabler/icons-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // Function to get the path for a different locale
  const getLocalizedPath = (targetLocale: string) => {
    // For the root page, we just need to switch between / and /zh-hant
    if (targetLocale === 'en') {
      return '/';
    } else {
      return '/zh-hant';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="cursor-pointer">
          <IconLanguage />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link 
            href={getLocalizedPath('en')}
            className={locale === 'en' ? 'bg-accent' : ''}
          >
            English
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link 
            href={getLocalizedPath('zh-hant')}
            className={locale === 'zh-hant' ? 'bg-accent' : ''}
          >
            繁體中文
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}