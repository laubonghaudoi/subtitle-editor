# Multi-Track Subtitle Implementation Summary

## What We Built

A proof-of-concept that demonstrates multiple subtitle tracks (different languages) displayed as parallel horizontal regions on a single audio waveform.

### Key Features Demonstrated:

1. **Dynamic Height Adjustment**

   - 1 track visible = Full waveform height (maintains current UX)
   - 2 tracks visible = Each track gets 1/2 height
   - 3 tracks visible = Each track gets 1/3 height
   - 4 tracks visible = Each track gets 1/4 height (maximum)

2. **Track Management**

   - Toggle tracks on/off with simple buttons
   - Maximum 4 tracks enforced
   - Each track has distinct color and label

3. **Region Functionality**

   - Regions are draggable horizontally (time adjustment)
   - Regions are resizable from edges (duration adjustment)
   - Regions stay within their track lane when dragged
   - No gaps between parallel regions (seamless appearance)

4. **Visual Design**
   - Clean, minimal interface
   - Clear track labels
   - Smooth transitions when toggling tracks
   - Professional appearance with proper borders

## Technical Implementation

### Core Approach

We will override the default `wavesurfer.js` RegionsPlugin behavior by manually positioning regions vertically based on their track assignment. This approach was validated in the POC component.

Note: The early POC component has been removed after productionization.

### Key Technical Decisions:

1. **Single Waveform Instance** - Better performance, cleaner UI
2. **CSS Positioning Override** - Direct manipulation of region elements
3. **Event-Driven Updates** - Regions recalculate position after drag/resize
4. **Ref-Based State** - Avoids React re-render loops
5. **Border-Box Sizing** - Ensures pixel-perfect alignment

## Production Implementation Checklist

### Phase 1: Data Model & Context

- [ ] **Data Model (`types/subtitle.ts`)**:
  - [ ] Extend `Subtitle` type to include `trackId`.
  - [ ] Create `SubtitleTrack` type with `id`, `name`, and a `subtitles: Subtitle[]` array.
- [ ] **Context API (`context/subtitle-context.tsx`)**:
  - [ ] Update `SubtitleContext` to manage an array of `SubtitleTrack`.
  - [ ] Add `activeTrackId` to the context to track the currently selected tab.
  - [ ] Add track management actions: `addTrack`, `removeTrack`, `renameTrack`, `deleteTrack`, `loadSubtitlesIntoTrack`.
  - [ ] Implement a `useEffect` to synchronize the undo/redo history with the `activeTrackId`.

### Phase 2: UI Components - Left Panel

- [ ] **Tabbed Interface (`app/[locale]/page.tsx`)**:
  - [ ] In the left panel, wrap the `SubtitleList` with the `Tabs` component from `components/ui/tabs.tsx`.
  - [ ] Conditionally render the `TabsList` only when `tracks.length > 1`.
  - [ ] Use `TabsContent` to render a `SubtitleList` for each track.
- [ ] **Load SRT Dialog (`components/load-srt.tsx`)**:
  - [ ] Create a dialog to manage tracks.
  - [ ] Include an editable list of tracks with options to "Load SRT", "Reload SRT", and "Start from Scratch".
  - [ ] Include a button to delete a track with an `AlertDialog` for confirmation.
  - [ ] Automatically rename a track when an SRT file is loaded into it.
- [ ] **Empty Track UI (`components/subtitle-list.tsx`)**:
  - [ ] When a track has no subtitles, display prompts to "Load SRT File" or "Start from Scratch".

### Phase 3: Waveform Integration ✅ COMPLETED

- [x] **Modify `WaveformVisualizer` (`components/waveform-visualizer.tsx`)**:
  - [x] Render regions from all _visible_ `SubtitleTrack` objects.
  - [x] The **active track** uses the established yellow color scheme and custom arrow-shaped handles.
  - [x] Non-active tracks use different, more subdued colors (blue, green, pink) with track-specific handle colors.
- [x] **Clicking a region** on any track automatically calls `setActiveTrackId` to switch the active tab.
- [x] **Dragging or resizing a region** updates the correct subtitle's `startTime` and `endTime` in the correct `SubtitleTrack` object via `updateSubtitleTimeByUuidAction` (no auto scroll/tab switch during drag).
  - [x] Collision detection (the logic in `handleRegionUpdate`) is scoped per-track.
- [x] **Auto-scroll and highlighting**: Clicking a region scrolls to and highlights the corresponding subtitle; dragging does not auto-scroll by design.
- [x] **Track switching with timing**: Proper delays ensure track switches complete before auto-scroll and highlighting occur for clicks.

#### Phase 3 Implementation Summary

- **Multi-track region rendering**: All tracks display their regions simultaneously with distinct colors
- **Track-specific styling**: Each track has its own color scheme and handle colors
- **Seamless track switching**: Clicking regions from different tracks automatically switches the active tab (dragging does not auto-switch by design)
- **Real-time synchronization**: Region changes immediately update the corresponding subtitle data
- **Enhanced UX**: Auto-scroll and highlighting provide immediate visual feedback
- **Robust timing**: Proper delays prevent race conditions during track switches
- **Per-track collision detection**: Region overlap prevention works correctly within each track

### Phase 4: Import/Export ✅ COMPLETED

- [x] **Save SRT Dialog (`components/save-srt.tsx`)**:
  - [x] Created separate component following `load-srt.tsx` pattern
  - [x] Reused the original save srt button functionality
  - [x] Dialog allows choosing which track to download
  - [x] **Smart UX**: Single track downloads directly (no dialog), multiple tracks show selection dialog
  - [x] Updated all translation keys from "export" to "save" terminology
  - [x] Integrated seamlessly with existing multi-track context

#### Phase 4 Implementation Summary

- **Streamlined UX**: Single track users get instant download, multi-track users get track selection
- **Consistent terminology**: All "export" references changed to "save" across codebase and translations
- **Modular design**: Reusable component that can be imported anywhere
- **Smart behavior**: Automatically detects track count and adjusts UX accordingly

### Phase 5: User Experience & Testing ✅ COMPLETED

- [x] Add keyboard shortcuts for track switching (Alt+1 to Alt+4).
- [x] Ensure mobile responsiveness of the new tabbed layout.
- [x] Performance testing with the maximum of 4 tracks.

#### Phase 5 Implementation Summary

- Keyboard: Alt+1–4 switches active track (ignores inputs/textareas, supports Option on macOS).
- Tabs: Tab list is horizontally scrollable on small screens; triggers don’t shrink.
- Tests: Added a lightweight performance sanity test for handling 4 tracks (`tests/performance-multitrack.test.ts`).

## Benefits of This Approach

1. **Minimal Dependencies** - No new libraries required
2. **Backwards Compatible** - Single track mode works like current version
3. **Performance** - Single waveform instance, efficient rendering
4. **Intuitive UX** - Natural extension of current interface
5. **Flexible** - Easy to extend to more features later

## Next Steps

1. Review and approve the approach
2. Create feature branch for implementation
3. Start with Phase 1 (Data Model)
4. Implement incrementally with tests
5. Get user feedback on beta version
