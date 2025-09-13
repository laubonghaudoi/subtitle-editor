import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseVTT } from '../lib/subtitleOperations';
import { timeToSeconds } from '../lib/utils';

const readFixture = (name: string) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('parseVTT parses styled-sample-1.vtt', () => {
  const raw = readFixture('styled-sample-1.vtt');
  const subs = parseVTT(raw);
  assert.ok(subs.length >= 4);
  // First cue
  const first = subs[0];
  assert.equal(first.startTime, '00:00:00,000');
  assert.equal(first.endTime, '00:00:03,500');
  assert.ok(first.text.includes('<b>Hello</b>'));
  // Ensure numeric ordering
  subs.forEach((s, i) => assert.equal(s.id, i + 1));
});

test('parseVTT handles MM:SS.mmm timestamps in styled-sample-2.vtt', () => {
  const raw = readFixture('styled-sample-2.vtt');
  const subs = parseVTT(raw);
  assert.ok(subs.length >= 5);
  // First cue uses MM:SS.mmm and should normalize to HH:MM:SS,mmm
  const first = subs.find(s => s.id === 1)!;
  assert.equal(first.startTime, '00:00:00,000');
  assert.equal(first.endTime, '00:00:02,000');
  assert.ok(first.text.includes('<i>English</i>'));
  // Check hour-range cue also preserved
  const anyHourCue = subs.find(s => s.startTime.startsWith('01:02:03'));
  assert.ok(anyHourCue);
});

test('parseVTT skips malformed cues but keeps valid ones', () => {
  const raw = readFixture('invalid-sample.vtt');
  const subs = parseVTT(raw);
  // Should include the final valid cue
  const ok = subs.find(s => s.text.includes('Valid cue after errors'));
  assert.ok(ok);
  // Malformed entries should not crash; ensure at least one valid remains
  assert.ok(subs.length >= 1);
  // Ensure times are consistent
  subs.forEach(s => assert.ok(timeToSeconds(s.endTime) > timeToSeconds(s.startTime)));
});

