# Verification Outputs

## 1. Subtitle Metrics Tests (`npx tsx --test tests/subtitle-metrics.test.ts`)

```
TAP version 13
# Subtest: parseTimestampToSeconds parses SRT and VTT formats correctly
ok 1 - parseTimestampToSeconds parses SRT and VTT formats correctly
  ---
  duration_ms: 0.507833
  type: 'test'
  ...
# Subtest: stripVttTagsAndNormalize strips VTT/HTML tags and normalizes whitespace
ok 2 - stripVttTagsAndNormalize strips VTT/HTML tags and normalizes whitespace
  ---
  duration_ms: 0.16375
  type: 'test'
  ...
# Subtest: calculateCps and calculateWpm produce exact expected values
ok 3 - calculateCps and calculateWpm produce exact expected values
  ---
  duration_ms: 0.097625
  type: 'test'
  ...
# Subtest: calculateCueMetrics calculates CPS/WPM for a known cue
ok 4 - calculateCueMetrics calculates CPS/WPM for a known cue
  ---
  duration_ms: 0.141625
  type: 'test'
  ...
# Subtest: calculateCueMetrics detects short duration below threshold
ok 5 - calculateCueMetrics detects short duration below threshold
  ---
  duration_ms: 0.081792
  type: 'test'
  ...
# Subtest: calculateCueMetrics detects overlaps and gap thresholds between cues
ok 6 - calculateCueMetrics detects overlaps and gap thresholds between cues
  ---
  duration_ms: 0.176958
  type: 'test'
  ...
# Subtest: calculateCueMetrics handles degenerate input without throwing
ok 7 - calculateCueMetrics handles degenerate input without throwing
  ---
  duration_ms: 0.140709
  type: 'test'
  ...
# Subtest: calculateTrackMetrics aggregates metrics across track
ok 8 - calculateTrackMetrics aggregates metrics across track
  ---
  duration_ms: 0.201
  type: 'test'
  ...
# Subtest: calculateTrackMetrics handles empty subtitle array
ok 9 - calculateTrackMetrics handles empty subtitle array
  ---
  duration_ms: 0.389125
  type: 'test'
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 157.96025
```

## 2. Full Test Suite (`npm test`)

```
TAP version 13
1..96
# tests 96
# suites 0
# pass 96
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 4638.6825
```
