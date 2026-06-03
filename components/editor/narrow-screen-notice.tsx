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
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-6 py-10 text-center text-black editor:hidden"
    >
      <div className="max-w-md space-y-4">
        <p className="text-sm font-semibold uppercase text-black">{eyebrow}</p>
        <h1
          id="narrow-screen-title"
          className="text-3xl font-semibold leading-tight"
        >
          {title}
        </h1>
        <p className="text-base leading-7 text-black">{description}</p>
        <p className="text-sm text-black">{minimum}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onProceed}
            className="inline-flex min-h-10 items-center justify-center rounded-xs bg-black px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            {proceedLabel}
          </button>
          <a
            href={faqHref}
            className="inline-flex min-h-10 items-center justify-center rounded-xs border border-black px-4 text-sm font-medium text-black transition hover:bg-black hover:text-white"
          >
            {faqLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
