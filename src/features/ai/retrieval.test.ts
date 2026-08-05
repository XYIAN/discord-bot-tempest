import { describe, expect, it } from 'vitest';
import { MAX_FACTS_CHARS, heroSlugFromKey, heroesMentioned, selectRelevantFacts } from './retrieval.js';
import type { Fact } from './knowledge.js';

let nextId = 1;
function fact(text: string, seedKey?: string): Fact {
  return {
    id: nextId++,
    text,
    category: 'heroes',
    status: 'approved',
    addedBy: '',
    addedByName: 'seed',
    addedAt: '2026-01-01T00:00:00.000Z',
    source: 'seed',
    seedKey,
  };
}

/** Enough filler to push the corpus over budget so selection actually engages. */
function overBudget(extra: Fact[]): Fact[] {
  const filler: Fact[] = [];
  const chunk = 'unrelated filler about something else entirely. '.repeat(20);
  while (filler.reduce((n, f) => n + f.text.length, 0) < MAX_FACTS_CHARS) {
    filler.push(fact(chunk + filler.length));
  }
  return [...filler, ...extra];
}

describe('heroSlugFromKey', () => {
  it('reads the hero name out of a seed key', () => {
    expect(heroSlugFromKey('hero-swordmaster-identity')).toBe('swordmaster');
    expect(heroSlugFromKey('hero-night-baron-passive')).toBe('night-baron');
    expect(heroSlugFromKey('hero-blazing-archer-synergy')).toBe('blazing-archer');
  });
  it('ignores keys that are not hero facts', () => {
    expect(heroSlugFromKey('exweapon-swordmaster')).toBeUndefined();
    expect(heroSlugFromKey('star-system')).toBeUndefined();
    expect(heroSlugFromKey(undefined)).toBeUndefined();
    expect(heroSlugFromKey('hero-')).toBeUndefined();
  });
});

describe('heroesMentioned — how members actually type names', () => {
  const slugs = ['swordmaster', 'night-baron', 'blazing-archer', 'ice-witch'];

  it('matches a one-word hero written as two words', () => {
    // The bug that made the bot call Swordmaster a Xenoscape hero: members
    // type "sword master", the data says "Swordmaster", and plain token
    // matching finds no overlap whatsoever.
    expect(heroesMentioned('is sword master a xenoscape hero?', slugs)).toContain('swordmaster');
  });
  it('matches a two-word hero written every plausible way', () => {
    for (const q of ['night baron', 'Night Baron', 'nightbaron', 'night-baron', 'NIGHT  BARON']) {
      expect(heroesMentioned(q, slugs), q).toContain('night-baron');
    }
  });
  it('does not match on a short fragment', () => {
    // A 3-character needle would match half the corpus by accident.
    expect(heroesMentioned('what about ice cream', slugs)).not.toContain('ice-witch');
  });
  it('finds several heroes in one question', () => {
    const found = heroesMentioned('swordmaster or blazing archer for wind?', slugs);
    expect([...found].sort()).toEqual(['blazing-archer', 'swordmaster']);
  });
});

describe('a named hero keeps their WHOLE fact family', () => {
  it('pins every aspect, not just the one that matched wording', () => {
    // Retrieving the Ascend fact (personal CRIT) while dropping the passive
    // (team CRIT DMG) is how "Blazing Archer is your main DPS" happened.
    const family = [
      fact('Blazing Archer is a Mythic Fire Ranger.', 'hero-blazing-archer-identity'),
      fact('His passive Crit Power Aura gives the TEAM CRIT DMG.', 'hero-blazing-archer-passive'),
      fact('At max Ascend his own CRIT Rate increases.', 'hero-blazing-archer-ascend'),
      fact('He is the CRIT DMG half of a crit comp.', 'hero-blazing-archer-synergy'),
    ];
    const selected = selectRelevantFacts(overBudget(family), 'is blazing archer a good main dps?');
    const keys = selected.map((f) => f.seedKey);
    for (const f of family) expect(keys).toContain(f.seedKey);
  });

  it('pins the family even when the name is spaced differently to the data', () => {
    const family = [
      fact('Swordmaster is a Mythic Wind Fighter.', 'hero-swordmaster-identity'),
      fact('Ironclad Aura gives Team DEF.', 'hero-swordmaster-passive'),
    ];
    const selected = selectRelevantFacts(overBudget(family), 'what tier is sword master');
    expect(selected.map((f) => f.seedKey)).toEqual(
      expect.arrayContaining(['hero-swordmaster-identity', 'hero-swordmaster-passive']),
    );
  });
});

describe('retrieval sees the conversation, not just the last message', () => {
  const family = [
    fact('Blazing Archer is a Mythic Fire Ranger.', 'hero-blazing-archer-identity'),
    fact('His passive gives the TEAM CRIT DMG, he is not a carry.', 'hero-blazing-archer-passive'),
  ];

  it('pins a hero named earlier in the thread', () => {
    // The exact live failure: the member's message was about Scarlet Reaper,
    // while the thread had been about a lineup containing Blazing Archer. The
    // model still discussed him — with none of his facts in the prompt.
    const selected = selectRelevantFacts(
      overBudget(family),
      'scarlet reaper has higher damage when health is higher',
      ['what is a good wind lineup?', 'Blazing Archer, Sword Saint and Cat Assassin.'],
    );
    expect(selected.map((f) => f.seedKey)).toContain('hero-blazing-archer-passive');
  });

  it('without that context the hero is NOT pinned — proving the context did the work', () => {
    const selected = selectRelevantFacts(
      overBudget(family),
      'scarlet reaper has higher damage when health is higher',
    );
    expect(selected.map((f) => f.seedKey)).not.toContain('hero-blazing-archer-passive');
  });
});

describe('budget and padding', () => {
  it('returns everything when the corpus fits — no selection risk at all', () => {
    const facts = [fact('a'), fact('b')];
    expect(selectRelevantFacts(facts, 'anything')).toHaveLength(2);
  });

  it('never pads the prompt with zero-scoring facts', () => {
    // The old version filled leftover budget with whatever came first in the
    // file, so an unmatched question got ~48 arbitrary facts presented as
    // "verified facts" — actively misleading rather than merely useless.
    const relevant = fact('Drakaina is a Fire dragon hero with a burn aura.');
    const selected = selectRelevantFacts(overBudget([relevant]), 'tell me about Drakaina');
    expect(selected).toContain(relevant);
    expect(selected.every((f) => /drakaina|fire|dragon|burn|aura|hero/i.test(f.text))).toBe(true);
  });

  it('scores distinct terms, so length alone cannot win', () => {
    const short = fact('Drakaina is Fire.');
    const padded = fact(`Drakaina ${'Drakaina '.repeat(40)}`);
    const selected = selectRelevantFacts(overBudget([short, padded]), 'what element is Drakaina');
    // Both mention it; the point is the repeat-stuffed one does not dominate.
    expect(selected).toContain(short);
  });
});
