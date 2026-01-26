const DEFAULT_TRACK_ALPHA = 0.2;

const TRACK_BASE_COLORS = [
  { token: "--amber-9", fallback: "#efb100" }, // Amber
  { token: "--blue-9", fallback: "#3b82f6" }, // Blue
  { token: "--crimson-9", fallback: "#c70036" }, // Crimson
  { token: "--green-9", fallback: "#009966" }, // Green
];
const FALLBACK_HANDLE_COLOR = TRACK_BASE_COLORS[0]?.fallback ?? "#fcd34d";

const colorCache = new Map<string, string>();
let swatchEl: HTMLSpanElement | null = null;
const getThemeKey = () => {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

const resolveCssColor = (value: string): string => {
  if (typeof document === "undefined") return value;
  if (!swatchEl) {
    swatchEl = document.createElement("span");
    swatchEl.style.position = "absolute";
    swatchEl.style.left = "-9999px";
    swatchEl.style.top = "-9999px";
    swatchEl.style.visibility = "hidden";
    (document.body ?? document.documentElement).appendChild(swatchEl);
  }
  swatchEl.style.color = value;
  const computed = getComputedStyle(swatchEl).color;
  return computed || value;
};

const resolveTokenColor = (token: string, fallback: string): string => {
  if (typeof document === "undefined") return fallback;
  const cacheKey = `${getThemeKey()}:${token}`;
  const cached = colorCache.get(cacheKey);
  if (cached) return cached;
  const resolved = resolveCssColor(
    token.startsWith("--") ? `var(${token})` : token,
  );
  const value = resolved || fallback;
  colorCache.set(cacheKey, value);
  return value;
};

const normalizeIndex = (index: number, length: number) => {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
};

const getBaseColor = (index: number): string => {
  if (TRACK_BASE_COLORS.length === 0) return FALLBACK_HANDLE_COLOR;
  const normalizedIndex = normalizeIndex(index, TRACK_BASE_COLORS.length);
  const entry = TRACK_BASE_COLORS[normalizedIndex];
  return resolveTokenColor(entry.token, entry.fallback);
};

export function getTrackHandleColor(index: number): string {
  return getBaseColor(index);
}

export function getTrackColor(
  index: number,
  alpha: number = DEFAULT_TRACK_ALPHA,
): string {
  return hexToRgba(getBaseColor(index), alpha);
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

const parseRgbString = (value: string) => {
  const match = value.match(/rgba?\\(([^)]+)\\)/i);
  if (!match) return null;
  const [rgbPart] = match[1].split("/");
  const parts = rgbPart.trim().split(/[\\s,]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const r = Number.parseFloat(parts[0]);
  const g = Number.parseFloat(parts[1]);
  const b = Number.parseFloat(parts[2]);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  return { r, g, b };
};

const parseColorFunction = (value: string) => {
  const match = value.match(/color\\(\\s*(display-p3|srgb)\\s+([^)]+)\\)/i);
  if (!match) return null;
  const coords = match[2]
    .split("/")
    .shift()
    ?.trim()
    .split(/[\\s,]+/)
    .filter(Boolean);
  if (!coords || coords.length < 3) return null;
  const [r, g, b] = coords.map((channel) => Number.parseFloat(channel));
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
  const clamp = (channel: number) =>
    Math.min(1, Math.max(0, channel)) * 255;
  return { r: clamp(r), g: clamp(g), b: clamp(b) };
};

const colorToRgbMaybe = (color: string) => {
  const resolved = resolveCssColor(
    color.startsWith("--") ? `var(${color})` : color,
  );
  const parsed = parseRgbString(resolved) ?? parseColorFunction(resolved);
  if (parsed) return parsed;
  if (resolved.startsWith("#")) return hexToRgb(resolved);
  return null;
};

const colorToRgb = (color: string) =>
  colorToRgbMaybe(color) ?? hexToRgb(FALLBACK_HANDLE_COLOR);

export const getReadableTextColor = (
  color: string,
  options?: {
    light?: string;
    dark?: string;
    threshold?: number;
  },
) => {
  const {
    light = "#ffffff",
    dark = "#111827",
    threshold = 0.65,
  } = options ?? {};
  const { r, g, b } = colorToRgb(color);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > threshold ? dark : light;
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

export const createContrastColor = (color: string) => {
  const { r, g, b } = colorToRgb(color);
  const { h, s, l } = rgbToHsl(r, g, b);
  const rotatedHue = (h + 150) % 360;
  const adjustedS = Math.min(0.6, s * 0.65);
  const adjustedL = Math.min(0.85, Math.max(0.35, l * 1.1));
  const contrastRgb = hslToRgb(rotatedHue / 360, adjustedS, adjustedL);
  return rgbToHex(contrastRgb);
};

export const hexToRgba = (color: string, alpha: number): string => {
  const parsed = colorToRgbMaybe(color);
  if (!parsed) {
    const alphaPercent = Math.round(alpha * 100);
    const mixed = `color-mix(in srgb, ${color} ${alphaPercent}%, transparent)`;
    if (typeof CSS !== "undefined" && CSS.supports("color", mixed)) {
      return mixed;
    }
    return color;
  }
  const { r, g, b } = parsed;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
