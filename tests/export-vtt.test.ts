import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSrtContent, buildVttContent } from '../lib/format';

const sampleSubs = [
  {
    uuid: 'a',
    id: 1,
    startTime: '00:00:00,000',
    endTime: '00:00:01,500',
    text: 'Hello',
  },
  {
    uuid: 'b',
    id: 2,
    startTime: '00:00:02,000',
    endTime: '00:00:03,000',
    text: '<i>World</i>',
  },
];

test('buildSrtContent emits SRT format', () => {
  const srt = buildSrtContent(sampleSubs as any);
  assert.ok(srt.includes('1\n00:00:00,000 --> 00:00:01,500'));
  assert.ok(srt.includes('Hello'));
  assert.ok(srt.includes('2\n00:00:02,000 --> 00:00:03,000'));
});

test('buildVttContent emits WEBVTT header and dot milliseconds', () => {
  const vtt = buildVttContent(sampleSubs as any);
  assert.ok(vtt.startsWith('WEBVTT'));
  assert.ok(vtt.includes('00:00:00.000 --> 00:00:01.500'));
  assert.ok(vtt.includes('Hello'));
});

