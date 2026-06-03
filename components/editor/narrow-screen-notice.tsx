interface NarrowScreenNoticeProps {
  eyebrow: string;
  title: string;
  description: string;
  minimum: string;
  faqHref: string;
  faqLabel: string;
  proceedLabel: string;
  onProceed: () => void;
}

export function NarrowScreenNotice({
  eyebrow,
  title,
  description,
  minimum,
  faqHref,
  faqLabel,
  proceedLabel,
  onProceed,
}: NarrowScreenNoticeProps) {
  return (
    <section
      aria-labelledby="narrow-screen-title"
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 px-6 py-10 text-center text-white editor:hidden"
    >
      <div className="max-w-md space-y-4">
        <p className="text-sm font-semibold uppercase text-teal-300">
          {eyebrow}
        </p>
        <h1
          id="narrow-screen-title"
          className="text-3xl font-semibold leading-tight"
        >
          {title}
        </h1>
        <p className="text-base leading-7 text-slate-200">{description}</p>
        <p className="text-sm text-slate-400">{minimum}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onProceed}
            className="inline-flex min-h-10 items-center justify-center rounded-xs bg-teal-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-200"
          >
            {proceedLabel}
          </button>
          <a
            href={faqHref}
            className="inline-flex min-h-10 items-center justify-center rounded-xs border border-teal-300 px-4 text-sm font-medium text-teal-100 transition hover:bg-teal-300 hover:text-slate-950"
          >
            {faqLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
