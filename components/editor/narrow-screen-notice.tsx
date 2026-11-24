interface NarrowScreenNoticeProps {
  title: string;
  description: string;
  minimum: string;
  faqHref: string;
  faqLabel: string;
  proceedLabel: string;
  onProceed: () => void;
}

export function NarrowScreenNotice({
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
      className="mt-8 border-t border-black/20 bg-white pt-6 text-black editor:hidden"
    >
      <div className="max-w-md space-y-4">
        <h2
          id="narrow-screen-title"
          className="text-xl font-semibold leading-tight"
        >
          {title}
        </h2>
        <p className="text-base leading-7 text-black">{description}</p>
        <p className="text-sm text-black">{minimum}</p>
        <div className="flex flex-col items-stretch gap-3 sm:items-center sm:flex-row">
          <button
            type="button"
            onClick={onProceed}
            className="inline-flex min-h-10 items-center justify-center rounded-xs bg-black px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            {proceedLabel}
          </button>
          <a
            href={faqHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-xs border border-black px-4 text-sm font-medium text-black transition hover:bg-black hover:text-white"
          >
            {faqLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
