"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconLanguage } from "@tabler/icons-react";
import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function LanguageSwitcher() {
  const locale = useLocale();

  // Function to get the path for a different locale
  const getLocalizedPath = (targetLocale: string) => {
    // For the root page, we just need to switch between / and /yue
    if (targetLocale === 'en') {
      return '/';
    } else {
      return '/yue';
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
            href={getLocalizedPath('yue')}
            className={locale === 'yue' ? 'bg-accent' : ''}
          >
            粵文
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}