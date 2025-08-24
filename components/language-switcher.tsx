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
import { locales, localeConfig } from '@/lib/locales';

export default function LanguageSwitcher() {
  const locale = useLocale();

  // Function to get the path for a different locale
  const getLocalizedPath = (targetLocale: string) => {
    if (targetLocale === 'en') {
      return '/';
    } else {
      return `/${targetLocale}`;
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
        {locales.map((loc) => (
          <DropdownMenuItem key={loc} asChild>
            <Link 
              href={getLocalizedPath(loc)}
              className={locale === loc ? 'bg-accent' : ''}
            >
              {localeConfig[loc].nativeName}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}