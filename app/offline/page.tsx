import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline Mode",
  description:
    "You appear to be offline. The editor stays available with cached assets.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-slate-100">
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          You&apos;re offline
        </h1>
        <p className="text-base text-slate-300">
          Cached assets keep Subtitle Editor running when the network drops.
          Any subtitles you load are saved locally until you reconnect.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
      >
        Return to editor
      </Link>
    </main>
  );
}
