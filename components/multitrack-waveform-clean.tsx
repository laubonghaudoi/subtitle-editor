"use client";

import { useWavesurfer } from "@wavesurfer/react";
import { useEffect, useRef, useState } from "react";
import RegionsPlugin, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface SubtitleTrack {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface TrackSubtitle {
  id: string;
  trackId: string;
  start: number;
  end: number;
  text: string;
}

const WAVEFORM_HEIGHT = 200;

// Sample data
const initialTracks: SubtitleTrack[] = [
  { id: "track-1", name: "English", color: "rgba(252, 211, 77, 0.5)", visible: true },
  { id: "track-2", name: "Spanish", color: "rgba(147, 197, 253, 0.5)", visible: false },
  { id: "track-3", name: "French", color: "rgba(165, 180, 252, 0.5)", visible: false },
  { id: "track-4", name: "German", color: "rgba(251, 191, 219, 0.5)", visible: false },
];

const sampleSubtitles: TrackSubtitle[] = [
  // English
  { id: "en-1", trackId: "track-1", start: 0, end: 3, text: "Hello and welcome" },
  { id: "en-2", trackId: "track-1", start: 5, end: 8, text: "This is a multi-track demo" },
  // Spanish
  { id: "es-1", trackId: "track-2", start: 0, end: 3, text: "Hola y bienvenido" },
  { id: "es-2", trackId: "track-2", start: 5, end: 8, text: "Esta es una demo multipista" },
  // French
  { id: "fr-1", trackId: "track-3", start: 0, end: 3, text: "Bonjour et bienvenue" },
  { id: "fr-2", trackId: "track-3", start: 5, end: 8, text: "C'est une démo multi-pistes" },
  // German
  { id: "de-1", trackId: "track-4", start: 0, end: 3, text: "Hallo und willkommen" },
  { id: "de-2", trackId: "track-4", start: 5, end: 8, text: "Dies ist eine Mehrspur-Demo" },
];

/**
 * Multi-Track Subtitle POC
 * 
 * Demonstrates how multiple subtitle tracks can be displayed as parallel
 * horizontal regions on a single waveform. Key features:
 * - Dynamic height adjustment based on visible tracks
 * - Draggable and resizable regions
 * - Track management with 4-track maximum
 * - Seamless visual appearance
 */
export default function MultiTrackWaveformClean() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tracks, setTracks] = useState<SubtitleTrack[]>(initialTracks);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const regionMapRef = useRef<Map<string, string>>(new Map());
  const isUpdatingRef = useRef(false);

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    height: WAVEFORM_HEIGHT,
    waveColor: "#A7F3D0",
    progressColor: "#00d4ff",
    cursorColor: "#b91c1c",
    normalize: true,
    plugins: [RegionsPlugin.create()],
  });

  // Load audio
  useEffect(() => {
    if (wavesurfer && audioFile) {
      const url = URL.createObjectURL(audioFile);
      wavesurfer.load(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [wavesurfer, audioFile]);

  // Setup regions when ready
  useEffect(() => {
    if (!wavesurfer) return;

    const setupRegions = () => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      const regionsPlugin = wavesurfer
        .getActivePlugins()
        .find((p) => p instanceof RegionsPlugin) as RegionsPlugin;

      if (!regionsPlugin) {
        isUpdatingRef.current = false;
        return;
      }

      // Clear and recreate
      regionsPlugin.clearRegions();
      regionMapRef.current.clear();

      const visibleTracks = tracks.filter(t => t.visible);
      const trackHeight = visibleTracks.length > 0 ? WAVEFORM_HEIGHT / visibleTracks.length : WAVEFORM_HEIGHT;

      sampleSubtitles.forEach((subtitle) => {
        const track = tracks.find(t => t.id === subtitle.trackId);
        if (!track?.visible) return;

        const trackIndex = visibleTracks.findIndex(t => t.id === subtitle.trackId);
        
        const region = regionsPlugin.addRegion({
          id: subtitle.id,
          start: subtitle.start,
          end: subtitle.end,
          color: track.color,
          drag: true,
          resize: true,
          minLength: 0.5, // Minimum half second
        });

        regionMapRef.current.set(subtitle.id, subtitle.trackId);

        if (region.element) {
          const yOffset = trackIndex * trackHeight;
          // Apply styles more carefully to preserve drag functionality
          region.element.style.position = 'absolute';
          region.element.style.top = `${yOffset}px`;
          region.element.style.height = `${trackHeight}px`;
          region.element.style.borderRadius = '0px';
          region.element.style.borderTop = `1px solid ${track.color.replace('0.5', '1')}`;
          region.element.style.borderBottom = `1px solid ${track.color.replace('0.5', '1')}`;
          region.element.style.borderLeft = `2px solid ${track.color.replace('0.5', '1')}`;
          region.element.style.borderRight = `2px solid ${track.color.replace('0.5', '1')}`;
          region.element.style.cursor = 'move';
          region.element.style.boxSizing = 'border-box';
          
          // Remove any existing content first
          region.element.innerHTML = '';
          
          const content = document.createElement('div');
          content.style.cssText = `
            padding: 8px;
            color: #1f2937;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            pointer-events: none;
          `;
          content.textContent = subtitle.text;
          region.element.appendChild(content);
          
          // Style the resize handles
          const handles = region.element.querySelectorAll('[part*="region-handle"]');
          handles.forEach((handle: Element) => {
            if (handle instanceof HTMLElement) {
              handle.style.width = '8px';
              handle.style.backgroundColor = track.color.replace('0.5', '0.8');
              handle.style.cursor = 'ew-resize';
            }
          });
        }
      });

      // Handle region updates to maintain track positioning
      regionsPlugin.on('region-updated', (region: Region) => {
        const trackId = regionMapRef.current.get(region.id);
        if (!trackId) return;

        const currentVisibleTracks = tracks.filter(t => t.visible);
        const currentTrackHeight = currentVisibleTracks.length > 0 ? 
          WAVEFORM_HEIGHT / currentVisibleTracks.length : WAVEFORM_HEIGHT;
        const visibleTrackIndex = currentVisibleTracks.findIndex(t => t.id === trackId);
        
        if (region.element && visibleTrackIndex !== -1) {
          const yOffset = visibleTrackIndex * currentTrackHeight;
          // Ensure position stays in the correct track after dragging
          region.element.style.position = 'absolute';
          region.element.style.top = `${yOffset}px`;
          region.element.style.height = `${currentTrackHeight}px`;
        }
      });

      isUpdatingRef.current = false;
    };

    wavesurfer.on('ready', setupRegions);
    
    // Check if already ready
    try {
      if (wavesurfer.getDuration() > 0) setupRegions();
    } catch {}

    return () => {
      wavesurfer.un('ready', setupRegions);
    };
  }, [wavesurfer, tracks]);

  const toggleTrack = (trackId: string) => {
    const visibleCount = tracks.filter(t => t.visible).length;
    const track = tracks.find(t => t.id === trackId);
    
    if (track && !track.visible && visibleCount >= 4) {
      alert("Maximum 4 tracks allowed");
      return;
    }

    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, visible: !t.visible } : t
    ));
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Multi-Track Subtitles (Clean Version)</h2>
      
      <div className="mb-4">
        <Label>
          Load Audio:
          <Input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </Label>
      </div>

      <div className="mb-4 flex gap-2">
        {tracks.map(track => (
          <Button
            key={track.id}
            variant={track.visible ? "default" : "outline"}
            size="sm"
            onClick={() => toggleTrack(track.id)}
          >
            {track.name}
          </Button>
        ))}
      </div>

      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
        <div ref={containerRef} />
        
        {/* Track labels */}
        {tracks.filter(t => t.visible).map((track, index) => {
          const visibleCount = tracks.filter(t => t.visible).length;
          const trackHeight = WAVEFORM_HEIGHT / visibleCount;
          return (
            <div
              key={track.id}
              className="absolute left-2 bg-white/90 px-2 py-1 rounded text-xs font-semibold pointer-events-none"
              style={{ 
                top: `${(index * trackHeight) + (trackHeight / 2) - 10}px`,
                zIndex: 10
              }}
            >
              {track.name}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>• Click track buttons to toggle visibility</p>
        <p>• 1 track = full height, 2+ tracks = divided height</p>
        <p>• Maximum 4 tracks can be displayed</p>
      </div>
    </div>
  );
}
