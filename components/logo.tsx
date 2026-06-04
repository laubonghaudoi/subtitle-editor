/**
 * The Subtitle Editor brand mark: four subtitle tracks over a waveform with a
 * playhead. Background is transparent so it sits on any surface. The track
 * stripes use the bright quartet in both themes; only the border and waveform
 * adapt (ink/white border; light/dark waveform colors).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Transparent tile + adaptive ink border */}
      <rect
        x="5"
        y="5"
        width="90"
        height="90"
        rx="4"
        fill="none"
        strokeWidth={5}
        className="stroke-[#0f172a] dark:stroke-[#e2e8f0]"
      />

      {/* Four subtitle tracks — bright quartet, borderless, sharp corners */}
      <rect
        x="16"
        y="16"
        width="34"
        height="6"
        rx="1"
        className="fill-[#ffc83d]"
      />
      <rect
        x="38"
        y="26"
        width="44"
        height="6"
        rx="1"
        className="fill-[#4dabf7]"
      />
      <rect
        x="20"
        y="36"
        width="30"
        height="6"
        rx="1"
        className="fill-[#ff6b6b]"
      />
      <rect
        x="46"
        y="46"
        width="36"
        height="6"
        rx="1"
        className="fill-[#51cf66]"
      />

      {/* Waveform — played (magenta) */}
      <g className="fill-[#cf4fa6] dark:fill-[#d95cb0]">
        <rect x="16" y="67" width="2.5" height="10" rx="1.25" />
        <rect x="20.9" y="63" width="2.5" height="18" rx="1.25" />
        <rect x="25.8" y="66" width="2.5" height="12" rx="1.25" />
        <rect x="30.7" y="60" width="2.5" height="24" rx="1.25" />
        <rect x="35.6" y="64" width="2.5" height="16" rx="1.25" />
        <rect x="40.5" y="59" width="2.5" height="26" rx="1.25" />
        <rect x="45.4" y="65" width="2.5" height="14" rx="1.25" />
      </g>
      {/* Waveform — unplayed (cyan) */}
      <g className="fill-[#1690b5] dark:fill-[#2ab3d6]">
        <rect x="50.3" y="61" width="2.5" height="22" rx="1.25" />
        <rect x="55.2" y="66" width="2.5" height="12" rx="1.25" />
        <rect x="60.1" y="62" width="2.5" height="20" rx="1.25" />
        <rect x="65" y="67" width="2.5" height="10" rx="1.25" />
        <rect x="69.9" y="64" width="2.5" height="16" rx="1.25" />
        <rect x="74.8" y="68" width="2.5" height="8" rx="1.25" />
        <rect x="79.7" y="66" width="2.5" height="12" rx="1.25" />
      </g>

      {/* Thin orange playhead */}
      <rect
        x="47.5"
        y="58"
        width="2.5"
        height="28"
        rx="1.25"
        className="fill-[#e8590c] dark:fill-[#ff7a30]"
      />
    </svg>
  );
}
