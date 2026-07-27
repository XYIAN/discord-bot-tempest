import { describe, expect, it } from 'vitest';
import { extractVersionNotes } from './changelog.js';

const SAMPLE = `# Changelog

## [0.2.0] - 2026-08-01

- New thing
- Another thing

## [0.1.0] - 2026-07-27

- First release
`;

describe('extractVersionNotes', () => {
  it('extracts the matching section only', () => {
    expect(extractVersionNotes(SAMPLE, '0.2.0')).toBe('- New thing\n- Another thing');
    expect(extractVersionNotes(SAMPLE, '0.1.0')).toBe('- First release');
  });

  it('returns undefined for a missing version', () => {
    expect(extractVersionNotes(SAMPLE, '9.9.9')).toBeUndefined();
  });

  it('does not treat dots as wildcards', () => {
    expect(extractVersionNotes('## [0x110] stuff', '0.1.0')).toBeUndefined();
  });

  it('handles headers without brackets', () => {
    expect(extractVersionNotes('## 1.0.0\nnotes here', '1.0.0')).toBe('notes here');
  });
});
