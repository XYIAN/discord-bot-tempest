import { describe, expect, it } from 'vitest';
import { parseCandidates, takeWithinBudget } from './memory-sync.js';

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

describe('takeWithinBudget', () => {
  it('keeps everything when it fits', () => {
    expect(takeWithinBudget(['aa', 'bb'], 100)).toEqual(['aa', 'bb']);
  });

  it('keeps the MOST RECENT items, not the oldest', () => {
    // The bug this replaced kept the head and then deleted everything, so the
    // newest conversations were discarded unread.
    expect(takeWithinBudget(['old', 'mid', 'new'], 8)).toEqual(['mid', 'new']);
  });

  it('preserves original order among the items it keeps', () => {
    expect(takeWithinBudget(['a', 'b', 'c', 'd'], 4)).toEqual(['c', 'd']);
  });

  it('returns empty when even one item exceeds the budget', () => {
    expect(takeWithinBudget(['averylongentry'], 3)).toEqual([]);
  });

  it('handles an empty list', () => {
    expect(takeWithinBudget([], 100)).toEqual([]);
  });
});
