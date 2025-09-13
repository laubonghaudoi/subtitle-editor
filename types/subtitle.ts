import { v4 as uuidv4 } from "uuid";

export interface Subtitle {
  uuid: string; // Unique identifier for React key and animation tracking
  id: number; // Sequential ID for SRT format
  startTime: string;
  endTime: string;
  text: string;
  trackId?: string; // To associate subtitle with a track
}

export interface SubtitleTrack {
  id: string; // Unique identifier for the track
  name: string; // User-facing name (e.g., "English")
  subtitles: Subtitle[];
}
