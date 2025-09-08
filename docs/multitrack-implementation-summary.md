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
We override the default wavesurfer.js RegionsPlugin behavior by manually positioning regions vertically based on their track assignment.

```javascript
// Key positioning logic
const yOffset = trackIndex * trackHeight;
region.element.style.position = 'absolute';
region.element.style.top = `${yOffset}px`;
region.element.style.height = `${trackHeight}px`;
```

### Key Technical Decisions:

1. **Single Waveform Instance** - Better performance, cleaner UI
2. **CSS Positioning Override** - Direct manipulation of region elements
3. **Event-Driven Updates** - Regions recalculate position after drag/resize
4. **Ref-Based State** - Avoids React re-render loops
5. **Border-Box Sizing** - Ensures pixel-perfect alignment

## Production Implementation Checklist

### Phase 1: Data Model & Context
- [ ] **Data Model**:
    - [ ] Extend `Subtitle` type to include `trackId`.
    - [ ] Create `SubtitleTrack` type with `id`, `name`, `language`, `color`, and subtitles array: `Subtitle[]`.
- [ ] **Context API**:
    - [ ] Update `SubtitleContext` to manage an array of `SubtitleTrack`.
    - [ ] Add `activeTrackId` to the context to track the currently selected tab.
    - [ ] Add track management actions: `addTrack`, `removeTrack`, `setActiveTrack`.

### Phase 2: UI Components - Left Panel
- [ ] **Tabbed Interface**:
    - [ ] In the left panel, wrap the `SubtitleList` with the `Tabs` component from `components/ui/tabs.tsx`.
    - [ ] Create a `TabsList` where each `TabsTrigger` represents a `SubtitleTrack`. The trigger should show the track name.
    - [ ] Add a "+" button to the `TabsList` to create a new track.
- [ ] **Content**:
    - [ ] Use `TabsContent` to render the `SubtitleList` for the active track.
    - [ ] Each `TabsContent` will contain one `SubtitleList` component, corresponding to one track.
- [ ] **Load SRT Dialog**:
    - [ ] When the main "Load SRT" button is clicked, open a `Dialog` component.
    - [ ] The dialog should give two options:
        1.  "Load SRT file into a new track".
        2.  "Create a new, empty track".
    - [ ] If the user chooses to load a file, it should create a new track and populate it with the parsed subtitles.

### Phase 3: Waveform Integration
- [ ] Modify `WaveformVisualizer` to render regions from all `SubtitleTrack` objects.
- [ ] Use the `color` property from each track to style its corresponding regions on the waveform.
- [ ] Ensure regions from the `activeTrackId` are visually distinct (e.g., higher z-index, brighter border).
- [ ] Update region creation logic and collision detection to be track-aware.

### Phase 4: Import/Export
- [ ] Design multi-track SRT format (e.g., with `[TRACK: Language]` tags) or consider exporting as a zip of SRT files.
- [ ] Update `parseSRT` to handle track information if using a custom format.
- [ ] Implement export functionality that saves all tracks.

### Phase 5: User Experience & Testing
- [ ] Add keyboard shortcuts for track switching (e.g., Alt+1, Alt+2).
- [ ] Ensure mobile responsiveness of the new tabbed layout.
- [ ] Performance testing with the maximum of 4 tracks.

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
