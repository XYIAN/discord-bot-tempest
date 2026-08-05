import { describe, expect, it } from 'vitest';
import { MAX_FACTS_CHARS, heroRosterFrom, heroSlugForKey, heroesMentioned, selectRelevantFacts } from './retrieval.js';
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

const ROSTER = heroRosterFrom([
  { seedKey: 'hero-swordmaster-identity' },
  { seedKey: 'hero-night-baron-identity' },
  { seedKey: 'hero-blazing-archer-identity' },
  { seedKey: 'hero-fire-mage-identity' },
  { seedKey: 'hero-fire-witch-identity' },
]);

describe('heroSlugForKey', () => {
  it('reads the hero name out of a seed key', () => {
    expect(heroSlugForKey('hero-swordmaster-identity', ROSTER)).toBe('swordmaster');
    expect(heroSlugForKey('hero-night-baron-passive', ROSTER)).toBe('night-baron');
  });
  it('handles aspects of ANY length, not just the last segment', () => {
    // 57 keys have a two-word aspect and the vocabulary is open-ended
    // (synergy-atkspd, ascend-1-2, crowd-control). Splitting on the last dash
    // gave "blazing-archer-main" — a slug nobody types — so his MAIN SKILL was
    // never pinned. The first version of this test only used one-word aspects
    // and passed for the wrong reason.
    expect(heroSlugForKey('hero-blazing-archer-main-skill', ROSTER)).toBe('blazing-archer');
    expect(heroSlugForKey('hero-blazing-archer-synergy-crit', ROSTER)).toBe('blazing-archer');
    expect(heroSlugForKey('hero-night-baron-ascend-1-2', ROSTER)).toBe('night-baron');
  });
  it('prefers the LONGEST matching hero name', () => {
    // Otherwise "fire-mage" facts could be attributed to a hero called "fire".
    expect(heroSlugForKey('hero-fire-witch-passive', ROSTER)).toBe('fire-witch');
    expect(heroSlugForKey('hero-fire-mage-passive', ROSTER)).toBe('fire-mage');
  });
  it('ignores keys that only LOOK hero-shaped', () => {
    // A general levelling mechanic, not a hero called "level". Pinning it to an
    // invented hero would be worse than leaving it to keyword scoring.
    expect(heroSlugForKey('hero-level-belongs-to-deployed-slot', ROSTER)).toBeUndefined();
    expect(heroSlugForKey('exweapon-swordmaster', ROSTER)).toBeUndefined();
    expect(heroSlugForKey(undefined, ROSTER)).toBeUndefined();
  });
});

describe('slug derivation against the REAL seed keys', () => {
  it('no derived slug still ends in an aspect word', async () => {
    // Guards the whole ASPECT_SUFFIXES list against the roster growing a new
    // key shape. If this fails, add the new suffix rather than deleting this.
    const { SEED_FACTS } = await import('./seed-facts.js');
    const realRoster = heroRosterFrom(SEED_FACTS.map((f) => ({ seedKey: f.key })));
    const bad: string[] = [];
    for (const f of SEED_FACTS) {
      const slug = heroSlugForKey(f.key, realRoster);
      if (slug && /-(main|sp|ascend|ascends|identity|passive|synergy|chain|skins|skill|role)$/.test(slug)) {
        bad.push(`${f.key} → ${slug}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every hero family resolves to one slug shared by all its facts', async () => {
    const { SEED_FACTS } = await import('./seed-facts.js');
    const realRoster = heroRosterFrom(SEED_FACTS.map((f) => ({ seedKey: f.key })));
    const bySlug = new Map<string, number>();
    for (const f of SEED_FACTS) {
      const slug = heroSlugForKey(f.key, realRoster);
      if (slug) bySlug.set(slug, (bySlug.get(slug) ?? 0) + 1);
    }
    // A real roster hero has several facts; a slug with exactly one is a sign
    // the name was split wrongly.
    // Some heroes genuinely have only an identity fact; the point is that
    // mis-splitting no longer manufactures dozens of phantom one-fact heroes.
    const singletons = [...bySlug.entries()].filter(([, n]) => n === 1).map(([s]) => s);
    expect(singletons.length).toBeLessThan(10);
    expect(bySlug.get('blazing-archer')).toBeGreaterThanOrEqual(6);
    expect(bySlug.get('swordmaster')).toBeGreaterThanOrEqual(5);
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

describe('rune families pin the same way hero families do', () => {
  // Prep for the rune capture. Members already ask about runes by name, and
  // without this their facts would fall back to plain keyword scoring the
  // moment the corpus outgrows the budget — the exact gap that made the bot
  // answer badly about heroes.
  const runeFacts = [
    fact('Meteor Rune is an ability rune that drops meteors.', 'rune-meteor-identity'),
    fact('Meteor Rune reaches Epic at 40 shards.', 'rune-meteor-upgrade'),
    fact('Meteor Rune synergises with Fire heroes.', 'rune-meteor-synergy'),
  ];

  it('naming a rune pins its whole family', () => {
    const selected = selectRelevantFacts(overBudget(runeFacts), 'is the meteor rune any good');
    const keys = selected.map((f) => f.seedKey);
    for (const f of runeFacts) expect(keys).toContain(f.seedKey);
  });

  it('a rune written as two words still matches', () => {
    const kb = [fact('Frost Bite rune slows enemies.', 'rune-frost-bite-identity')];
    const selected = selectRelevantFacts(overBudget(kb), 'what does frostbite rune do');
    expect(selected.map((f) => f.seedKey)).toContain('rune-frost-bite-identity');
  });

  it('heroes and runes pin independently in the same question', () => {
    const mixed = [
      ...runeFacts,
      fact('Blazing Archer is Fire.', 'hero-blazing-archer-identity'),
      fact('His passive buffs team CRIT DMG.', 'hero-blazing-archer-passive'),
    ];
    const selected = selectRelevantFacts(overBudget(mixed), 'is meteor rune good on blazing archer');
    const keys = selected.map((f) => f.seedKey);
    expect(keys).toContain('rune-meteor-synergy');
    expect(keys).toContain('hero-blazing-archer-passive');
  });

  it('an unrelated question pins neither', () => {
    const selected = selectRelevantFacts(overBudget(runeFacts), 'how do star tiers work');
    expect(selected.map((f) => f.seedKey)).not.toContain('rune-meteor-synergy');
  });
});
