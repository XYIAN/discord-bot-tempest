import { describe, expect, it } from 'vitest';
import { parseCandidates } from './memory-sync.js';

describe('parseCandidates', () => {
  it('parses a clean JSON array', () => {
    const raw = '[{"text": "Drakaina is a top-tier fire hero", "category": "heroes"}]';
    expect(parseCandidates(raw)).toEqual([
      { text: 'Drakaina is a top-tier fire hero', category: 'heroes' },
    ]);
  });

  it('extracts JSON wrapped in prose', () => {
    const raw = 'Here are the facts:\n[{"text": "Runes have two slot rows to unlock", "category": "runes"}]\nDone.';
    expect(parseCandidates(raw)).toHaveLength(1);
  });

  it('returns empty for garbage, empty arrays, and malformed items', () => {
    expect(parseCandidates('no json here')).toEqual([]);
    expect(parseCandidates('[]')).toEqual([]);
    expect(parseCandidates('[{"nope": true}]')).toEqual([]);
    expect(parseCandidates('[{"text": "short", "category": "x"}]')).toEqual([]);
  });
});
