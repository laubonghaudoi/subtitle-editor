"use client";

import dynamic from "next/dynamic";

const MultiTrackWaveformClean = dynamic(
  () => import("@/components/multitrack-waveform-clean"),
  { ssr: false }
);

export default function MultiTrackWaveformPage() {
  return (
    <div className="container mx-auto py-8">
      <MultiTrackWaveformClean />
    </div>
  );
}
