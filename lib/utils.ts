import type { Subtitle } from "@/types/subtitle";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to convert SRT timestamp to seconds
export const timeToSeconds = (time: string): number => {
  const [hours, minutes, seconds] = time
    .split(":")
    .map((part) => Number.parseFloat(part.replace(",", ".")));
  return hours * 3600 + minutes * 60 + seconds;
};

// Function to convert seconds to SRT timestamp format
export const secondsToTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${secs.toFixed(3).padStart(6, "0").replace(".", ",")}`;
};

// If you store your subtitles in an array, you might do something like:
export const subtitlesToSrtString = (subtitles: Subtitle[]): string => {
  return subtitles
    .map((sub) => `${sub.startTime} --> ${sub.endTime}\n${sub.text}\n`)
    .join("\n");
};

export const srtToVtt = (srtString: string): string => {
  return `WEBVTT\n\n${srtString
    .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2")
    .replace(/(\r?\n\r?\n)/g, "\n")}`;
};

// Function to validate time format
export const isValidTime = (time: string): boolean => {
  return /^\d{2}:\d{2}:\d{2},\d{3}$/.test(time);
};

// Helper function to escape regex special characters
export const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
