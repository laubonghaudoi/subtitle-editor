import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const locales = ['en', 'yue'];

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const isTraditionalChinese = locale === 'yue';
  
  return {
    title: isTraditionalChinese 
      ? "字幕編輯器 - 永久免費、開源、完全基於網頁的 SRT 字幕編輯工具"
      : "Subtitle Editor - Permanently Free, Open-source, Fully Web-based SRT Editing Tool",
    description: isTraditionalChinese
      ? "使用這個免費、開源、基於網頁的編輯器輕鬆編輯、建立和對齊 SRT 字幕檔案。具有影片預覽和波形視覺化功能。無需註冊。"
      : "Edit, create, and align SRT subtitle and captions files easily with this free, open-source, web-based editor. Features video preview and waveform visualization. No signup required.",
    openGraph: {
      title: isTraditionalChinese 
        ? "字幕編輯器 - 永久免費、開源、完全基於網頁的 SRT 字幕編輯工具"
        : "Subtitle Editor - Permanently Free, Open-source, Fully Web-based SRT Editing Tool",
      description: isTraditionalChinese
        ? "使用這個免費、開源、基於網頁的編輯器輕鬆編輯、建立和對齊 SRT 字幕檔案。具有影片預覽和波形視覺化功能。無需註冊。"
        : "Edit, create, and align SRT subtitle and captions files easily with this free, open-source, web-based editor. Features video preview and waveform visualization. No signup required.",
      url: isTraditionalChinese 
        ? "https://subtitle-editor.org/yue"
        : "https://subtitle-editor.org",
      locale: isTraditionalChinese ? "zh_TW" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}