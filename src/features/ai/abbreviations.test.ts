import { describe, expect, it } from 'vitest';
import {
  abbreviationNotice,
  buildAbbreviationIndex,
  displayName,
  initialsFor,
  resolveAbbreviations,
} from './abbreviations.js';

const ROSTER = [
  'starlight-weaver',
  'swordmaster',
  'scarlet-reaper',
  'blazing-archer',
  'sword-saint',
  'monkey-king',
  'fabled-lyra',
  'frost-lich',
  'seraph',
];
const INDEX = buildAbbreviationIndex(ROSTER);

describe('initialsFor', () => {
  it('takes the first letter of each word', () => {
    expect(initialsFor('starlight-weaver')).toBe('SW');
    expect(initialsFor('blazing-archer')).toBe('BA');
    expect(initialsFor('swordmaster')).toBe('S');
  });
});

describe('buildAbbreviationIndex', () => {
  it('SW is Starlight Weaver, not Swordmaster', () => {
    // The bug this whole module exists for. Swordmaster is ONE word, so his
    // initials are "S", never "SW" — the member was using the normal
    // convention and the bot mis-resolved it.
    expect(INDEX.unique.get('SW')).toBe('starlight-weaver');
  });
  it('ignores single-letter initials entirely', () => {
    // "S" would otherwise match the letter S anywhere, and nobody types a bare
    // S to mean Swordmaster specifically.
    expect(INDEX.unique.has('S')).toBe(false);
    expect(INDEX.ambiguous.has('S')).toBe(false);
  });
  it('marks genuinely shared initials as ambiguous', () => {
    expect(INDEX.ambiguous.get('FL')?.sort()).toEqual(['fabled-lyra', 'frost-lich']);
    expect(INDEX.unique.has('FL')).toBe(false);
  });
  it('is derived from the roster, so a new hero needs no code change', () => {
    const extended = buildAbbreviationIndex([...ROSTER, 'thunder-pharaoh']);
    expect(extended.unique.get('TP')).toBe('thunder-pharaoh');
  });
});

describe('resolveAbbreviations', () => {
  it('resolves the message that caused the bug', () => {
    const r = resolveAbbreviations('How do I include a xeno as part of my team? Understand that SW is ideal', INDEX);
    expect(r.resolved).toEqual([{ abbr: 'SW', hero: 'Starlight Weaver' }]);
    expect(r.ambiguous).toEqual([]);
  });
  it('resolves several in one message', () => {
    const r = resolveAbbreviations('is SR or BA my main damage dealer', INDEX);
    expect(r.resolved.map((x) => x.abbr).sort()).toEqual(['BA', 'SR']);
  });
  it('flags ambiguous ones instead of picking', () => {
    const r = resolveAbbreviations('what about FL', INDEX);
    expect(r.resolved).toEqual([]);
    expect(r.ambiguous[0]?.options.sort()).toEqual(['Fabled Lyra', 'Frost Lich']);
  });
  it('ignores lowercase words and ordinary text', () => {
    // Must not fire on every message; only ALL-CAPS 2-3 letter runs count.
    expect(resolveAbbreviations('what is the best team for wind', INDEX).resolved).toEqual([]);
    expect(resolveAbbreviations('sw is ideal', INDEX).resolved).toEqual([]);
  });
  it('ignores unknown initials rather than guessing at them', () => {
    expect(resolveAbbreviations('what about XYZ and QQ', INDEX)).toEqual({ resolved: [], ambiguous: [] });
  });
  it('does not repeat the same abbreviation twice', () => {
    const r = resolveAbbreviations('SW and SW again, plus SW', INDEX);
    expect(r.resolved).toHaveLength(1);
  });
  it('handles empty and junk input', () => {
    for (const v of ['', null as unknown as string, undefined as unknown as string]) {
      expect(resolveAbbreviations(v, INDEX)).toEqual({ resolved: [], ambiguous: [] });
    }
  });
});

describe('abbreviationNotice', () => {
  it('is empty when there is nothing to say', () => {
    // The prompt must be unchanged for the majority of questions.
    expect(abbreviationNotice({ resolved: [], ambiguous: [] })).toBe('');
  });
  it('states the resolution as an instruction, not a hint', () => {
    const n = abbreviationNotice(resolveAbbreviations('best team with SW', INDEX));
    expect(n).toMatch(/SW = Starlight Weaver/);
    expect(n).toMatch(/do not substitute a different hero/);
  });
  it('demands a question for ambiguous initials', () => {
    const n = abbreviationNotice(resolveAbbreviations('what about FA and FL', INDEX));
    expect(n).toMatch(/MUST ask which hero is meant/);
  });
});

describe('displayName', () => {
  it('turns a slug into the name members see', () => {
    expect(displayName('starlight-weaver')).toBe('Starlight Weaver');
    expect(displayName('swordmaster')).toBe('Swordmaster');
  });
});

describe('against the real roster', () => {
  it('SW resolves to Starlight Weaver with the live hero list', async () => {
    const { SEED_FACTS } = await import('./seed-facts.js');
    const { heroRosterFrom } = await import('./retrieval.js');
    const roster = heroRosterFrom(SEED_FACTS.map((f) => ({ seedKey: f.key })));
    const idx = buildAbbreviationIndex(roster);
    expect(idx.unique.get('SW')).toBe('starlight-weaver');
    expect(idx.unique.get('BA')).toBe('blazing-archer');
    expect(idx.unique.get('MK')).toBe('monkey-king');
    // Monkey King is MK. The bot answered "Monkey King (SW)".
    expect(idx.unique.get('SW')).not.toBe('monkey-king');
  });
});

describe('game vocabulary is never a hero (the HP trap)', () => {
  it('"which hero has the most HP" is about hit points, not High Priest', () => {
    // High Priest's initials really are HP. Resolving them would put a
    // confident wrong statement at the TOP of the prompt on a very common
    // question — worse than the guessing this module prevents, because it
    // would fire constantly.
    const idx = buildAbbreviationIndex([...ROSTER, 'high-priest']);
    expect(resolveAbbreviations('which hero has the most HP', idx).resolved).toEqual([]);
  });
  it('common stat and chat shorthand never resolves', () => {
    const idx = buildAbbreviationIndex([...ROSTER, 'high-priest']);
    for (const q of ['what boosts ATK and DEF', 'best DPS hero', 'how much CRIT DMG',
      'is the EX weapon worth it', 'PVP or PVE', 'MAX ascend', 'SP skill', 'GG']) {
      expect(resolveAbbreviations(q, idx).resolved, q).toEqual([]);
    }
  });
  it('but real hero initials still resolve in the same sentence', () => {
    const idx = buildAbbreviationIndex([...ROSTER, 'high-priest']);
    const r = resolveAbbreviations('does SW have more HP than BA', idx);
    expect(r.resolved.map((x) => x.abbr).sort()).toEqual(['BA', 'SW']);
  });
});
