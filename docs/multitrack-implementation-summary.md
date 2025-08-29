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

### Phase 1: Data Model
- [ ] Extend `Subtitle` type to include `trackId`
- [ ] Create `SubtitleTrack` type with id, name, language, color, visible
- [ ] Update subtitle context to support tracks
- [ ] Add track management actions (add, remove, toggle visibility)

### Phase 2: UI Components
- [ ] Create track selector component
- [ ] Update subtitle list to group by track
- [ ] Add active track indicator
- [ ] Implement track color picker

### Phase 3: Waveform Integration
- [ ] Modify `WaveformVisualizer` to support multi-track regions
- [ ] Update region creation logic with track positioning
- [ ] Handle region drag/resize with track constraints
- [ ] Update collision detection to be track-aware

### Phase 4: Import/Export
- [ ] Design multi-track SRT format (e.g., with [TRACK: Language] tags)
- [ ] Update parseSRT to handle track information
- [ ] Implement export with track metadata
- [ ] Support importing multiple SRT files to different tracks

### Phase 5: User Experience
- [ ] Add keyboard shortcuts for track switching (Alt+1, Alt+2, etc.)
- [ ] Implement drag between tracks (with Shift modifier)
- [ ] Add "Convert to Multi-track" option for existing projects
- [ ] Create help documentation

### Phase 6: Testing & Polish
- [ ] Test with various audio lengths
- [ ] Ensure mobile responsiveness
- [ ] Performance testing with 4 tracks
- [ ] Accessibility improvements

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
