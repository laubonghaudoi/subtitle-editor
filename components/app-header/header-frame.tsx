import { Logo } from "@/components/logo";
import type { ReactNode } from "react";

export function HeaderFrame({
  as: Tag = "header",
  children,
}: {
  as?: "header" | "nav";
  children: ReactNode;
}) {
  return (
    <Tag className="flex min-h-[6vh] flex-wrap items-center justify-between gap-2 border-b-2 border-foreground px-3 py-2 sm:px-6 lg:px-12">
      {children}
    </Tag>
  );
}

export function HeaderBrand({
  as: Tag = "span",
  title,
}: {
  as?: "span" | "h1";
  title: string;
}) {
  return (
    <Tag className="mx-1 inline-flex items-center gap-2 text-lg font-semibold sm:mx-4">
      <Logo className="size-[1.25em] shrink-0" />
      {title}
    </Tag>
  );
}
