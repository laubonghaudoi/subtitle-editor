export const TRACK_COLORS = [
  "#fcd34d40", // Yellow (active track)
  "#3b82f640", // Blue
  "#ec489940", // Red
  "#84cc1640", // Green
];

export const TRACK_HANDLE_COLORS = [
  "#f59e0b", // Yellow (active track)
  "#3b82f6", // Blue
  "#ec4899", // Red
  "#22c55e", // Green
];

export function getTrackHandleColor(index: number): string {
  if (TRACK_HANDLE_COLORS.length === 0) return "#f59e0b";
  const normalizedIndex =
    ((index % TRACK_HANDLE_COLORS.length) + TRACK_HANDLE_COLORS.length) %
    TRACK_HANDLE_COLORS.length;
  return TRACK_HANDLE_COLORS[normalizedIndex];
}

export function getTrackColor(index: number): string {
  if (TRACK_COLORS.length === 0) return "#fcd34d40";
  const normalizedIndex =
    ((index % TRACK_COLORS.length) + TRACK_COLORS.length) % TRACK_COLORS.length;
  return TRACK_COLORS[normalizedIndex];
}
