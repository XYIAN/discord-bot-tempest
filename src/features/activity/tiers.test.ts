import { describe, expect, it } from 'vitest';
import type { Tier } from '../../config/guild.js';
import { nextTier, tierFor } from './index.js';

const TIERS: Tier[] = [
  { role: { name: 'Bronze' }, threshold: 10 },
  { role: { name: 'Silver' }, threshold: 100 },
  { role: { name: 'Gold' }, threshold: 500 },
];

describe('tierFor', () => {
  it('returns undefined below the first threshold', () => {
    expect(tierFor(0, TIERS)).toBeUndefined();
    expect(tierFor(9, TIERS)).toBeUndefined();
  });

  it('returns the highest tier reached', () => {
    expect(tierFor(10, TIERS)?.role.name).toBe('Bronze');
    expect(tierFor(99, TIERS)?.role.name).toBe('Bronze');
    expect(tierFor(100, TIERS)?.role.name).toBe('Silver');
    expect(tierFor(9999, TIERS)?.role.name).toBe('Gold');
  });
});

describe('nextTier', () => {
  it('returns the next tier to reach', () => {
    expect(nextTier(0, TIERS)?.role.name).toBe('Bronze');
    expect(nextTier(10, TIERS)?.role.name).toBe('Silver');
    expect(nextTier(500, TIERS)).toBeUndefined();
  });
});
