"use client";

import { createContext, useContext } from 'react';
import type { Dictionary } from '@/lib/i18n';
import en from '@/locales/en.json';

const TranslationContext = createContext<Dictionary>(en);

export function TranslationProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <TranslationContext.Provider value={dictionary}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const dict = useContext(TranslationContext);
  return (key: keyof Dictionary) => dict[key] ?? key;
}
