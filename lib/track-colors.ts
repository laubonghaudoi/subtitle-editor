export const TRACK_COLORS = [
  "#fcd34d40", // Yellow (active track)
  "#3b82f640", // Blue
  "#c7003640", // Red
  "#00996640", // Green
];

export const TRACK_HANDLE_COLORS = [
  "#f59e0b", // Yellow (active track)
  "#3b82f6", // Blue
  "#c70036", // Red
  "#009966", // Green
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

const hexToRgb = (hex: string) => {
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (normalized.length === 8) {
    normalized = normalized.slice(0, 6);
  }
  const bigint = Number.parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;

const rgbToHsl = (r: number, g: number, b: number) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  const hue2rgb = (p: number, q: number, t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  if (s === 0) {
    const component = Math.round(l * 255);
    return { r: component, g: component, b: component };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
};

export const createContrastColor = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const rotatedHue = (h + 150) % 360;
  const adjustedS = Math.min(0.6, s * 0.65);
  const adjustedL = Math.min(0.85, Math.max(0.35, l * 1.1));
  const contrastRgb = hslToRgb(rotatedHue / 360, adjustedS, adjustedL);
  return rgbToHex(contrastRgb);
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
