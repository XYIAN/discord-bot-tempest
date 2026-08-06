import { describe, expect, it } from 'vitest';
import { MAX_FACTS_CHARS, selectRelevantFacts } from './retrieval.js';
import { SEED_FACTS } from './seed-facts.js';
import type { Fact } from './knowledge.js';

/**
 * Retrieval accuracy against REAL questions members asked in #tempest-ai.
 *
 * The bot was giving confidently wrong answers — calling Swordmaster a
 * Xenoscape hero, calling Blazing Archer "your main damage dealer", getting
 * hero elements wrong. Every one of those facts is present and correct in
 * seed-facts.ts, so none of it was a data problem: the answering fact simply
 * never reached the model.
 *
 * This file measures that directly. For each question it asks the only
 * question that matters — "did the fact that answers this survive selection?"
 * — because a fact that does not reach the prompt cannot ground an answer, and
 * the model fills the gap by inventing.
 */

/** Turn the seed list into the Fact shape selectRelevantFacts consumes. */
const ALL_FACTS: Fact[] = SEED_FACTS.map((seed, i) => ({
  id: i + 1,
  text: seed.text,
  category: seed.category,
  status: 'approved',
  addedBy: '',
  addedByName: 'seed',
  addedAt: '2026-01-01T00:00:00.000Z',
  source: 'seed',
  seedKey: seed.key,
}));

/**
 * Real member questions, paired with the seed key that answers them.
 *
 * Phrasing is kept exactly as members type it — lowercase, spaces inside hero
 * names, missing apostrophes. That is the point: "sword master" and
 * "Swordmaster" are the same hero to a person and different tokens to a
 * word-matching scorer.
 */
const CASES: Array<{ question: string; needs: string; why: string }> = [
  {
    question: 'is sword master a xenoscape hero?',
    needs: 'hero-swordmaster-identity',
    why: 'Bot called him Xenoscape. He is Mythic/Wind.',
  },
  {
    question: 'what tier is sword master',
    needs: 'hero-swordmaster-identity',
    why: 'Same hero, space-separated as members type it.',
  },
  {
    question: 'is blazing archer a good main dps?',
    needs: 'hero-blazing-archer-synergy',
    why: 'Bot called him "your main damage dealer"; he is a team CRIT DMG buffer.',
  },
  {
    question: 'what does blazing archer passive do',
    needs: 'hero-blazing-archer-passive',
    why: 'Crit Power Aura is team-wide, not personal damage.',
  },
  {
    question: 'what element is ice witch',
    needs: 'hero-ice-witch-identity',
    why: 'Members reported wrong elements coming back.',
  },
  {
    question: 'tell me about night baron',
    needs: 'hero-night-baron-identity',
    why: 'Two-word hero name, the most common shape in this roster.',
  },
  {
    question: 'who should i pair with swordmaster',
    needs: 'hero-swordmaster-synergy',
    why: 'Team-building is the use case Kyle wants to support.',
  },
  {
    question: 'what is demon hunter good for',
    needs: 'hero-demon-hunter-synergy',
    why: 'Two-word name plus a vague verb.',
  },

  // ── Treasures (runes) ──────────────────────────────────────────────────
  // Runes were the single most-asked topic the bot had nothing for. These
  // cases matter more than the hero ones did, because a member naming a
  // treasure is asking for its exact numbers — the failure mode is a plausible
  // invented ladder, which reads just like a real one.
  {
    question: 'what does soulfrost gyro do',
    needs: 'rune-soulfrost-gyro-tiers',
    why: 'Named treasure — the tier ladder is the answer, not the identity blurb.',
  },
  {
    question: 'what runes should i use for frost lich',
    needs: 'runes-ice-roster',
    why: 'Asks by HERO, not by treasure name. The roster fact is the only one that maps a hero to his two treasures.',
  },
  {
    question: 'best treasures for the ice summon core',
    needs: 'runes-for-the-ice-summon-core',
    why: 'The conclusion fact. Without it the bot ranks by raw ATK% and recommends the wrong ones.',
  },
  {
    question: 'is frigid hexblood a defensive rune',
    needs: 'rune-frigid-hexblood-identity',
    why: 'The honest answer is "only its first two tiers" — the identity fact is where that nuance lives.',
  },
  {
    question: 'how many treasures can i carry',
    needs: 'runes-carry-limit-and-slots',
    why: 'Plain system question, no entity name to pin on.',
  },
  {
    question: 'what rarity are treasures',
    needs: 'runes-rarity-ladder',
    why: 'Treasures use Excellent where heroes use Rare; guessing the hero ladder is wrong.',
  },
  {
    question: 'what does aerolux do',
    needs: 'rune-aerolux-tiers',
    why: 'Wind treasure named directly — its family must pin.',
  },
  {
    question: 'best runes for cat assassin',
    needs: 'runes-wind-roster',
    why: 'Asked by hero. Only the Wind roster fact maps a hero to their two treasures.',
  },
  {
    question: 'what rune does swordmaster want',
    needs: 'runes-wind-roster',
    why: 'Same shape, and Swordmaster is the hero the SW bug was about.',
  },
  {
    question: 'why do i have duplicate treasures',
    needs: 'runes-fusion-rarity-up',
    why: 'A real question with no entity to pin on — duplicates ARE the upgrade material.',
  },
  {
    question: 'how do i upgrade a treasure',
    needs: 'runes-fusion-rarity-up',
    why: 'Two fusion paths exist; answering with only the token one would be wrong.',
  },
  {
    question: 'do treasures help all my heroes',
    needs: 'runes-stats-vs-skills',
    why: 'The stats/skills split is the answer, and nothing in the question names an entity.',
  },
];

/**
 * Padding that forces selection to actually run.
 *
 * The whole corpus fits in the budget today, so calling selectRelevantFacts
 * directly returns everything and every assertion below would pass without
 * exercising a single line of the ranking code. These tests exist to protect
 * the roster as it GROWS past one prompt — which is exactly when the algorithm
 * starts mattering — so they run against a corpus deliberately pushed over the
 * limit.
 */
const FILLER: Fact[] = (() => {
  const out: Fact[] = [];
  const chunk = 'unrelated padding about an entirely different subject. '.repeat(30);
  let size = 0;
  while (size < MAX_FACTS_CHARS) {
    out.push({
      id: 100_000 + out.length,
      text: chunk + out.length,
      category: 'general',
      status: 'approved',
      addedBy: '',
      addedByName: 'filler',
      addedAt: '2026-01-01T00:00:00.000Z',
      source: 'seed',
    });
    size += chunk.length;
  }
  return out;
})();

const OVER_BUDGET = [...FILLER, ...ALL_FACTS];

function retrievedKeys(question: string, context: string[] = []): Set<string> {
  return new Set(
    selectRelevantFacts(OVER_BUDGET, question, context)
      .map((f) => f.seedKey)
      .filter((k): k is string => Boolean(k)),
  );
}

describe('retrieval reaches the fact that answers the question', () => {
  it('selection is genuinely engaged for these cases', () => {
    // Without this the padding could silently stop working and every case below
    // would pass by returning the entire corpus.
    const total = OVER_BUDGET.reduce((n, f) => n + f.text.length, 0);
    expect(total).toBeGreaterThan(MAX_FACTS_CHARS);
    expect(selectRelevantFacts(OVER_BUDGET, 'swordmaster').length).toBeLessThan(OVER_BUDGET.length);
  });

  for (const { question, needs, why } of CASES) {
    it(`"${question}" → ${needs} (${why})`, () => {
      expect([...retrievedKeys(question)]).toContain(needs);
    });
  }
});

describe('naming a hero pulls that hero\'s whole fact family', () => {
  // Answering "is X good?" well needs identity, passive AND synergy together.
  // Retrieving one of the three produces a confident half-answer, which is
  // exactly how "Blazing Archer is your main DPS" happened: his personal
  // CRIT Ascend was visible while his team-buff passive was not.
  const FAMILIES: Array<[string, string]> = [
    ['swordmaster', 'hero-swordmaster-'],
    ['blazing archer', 'hero-blazing-archer-'],
    ['night baron', 'hero-night-baron-'],
  ];

  for (const [name, prefix] of FAMILIES) {
    it(`"tell me about ${name}" retrieves every ${prefix}* fact`, () => {
      const want = ALL_FACTS.filter((f) => f.seedKey?.startsWith(prefix)).map((f) => f.seedKey);
      expect(want.length).toBeGreaterThan(3);
      const got = retrievedKeys(`tell me about ${name}`);
      expect([...want].filter((k) => !got.has(k!))).toEqual([]);
    });
  }
});

describe('the whole roster fits in one prompt today', () => {
  it('no selection happens at the current corpus size', () => {
    // The real safeguard: at 106k chars against a 140k budget nothing is
    // dropped at all, so no ranking decision can go wrong in production yet.
    // If a future import pushes past this, the tests above are what protect it.
    const total = ALL_FACTS.reduce((n, f) => n + f.text.length, 0);
    expect(total).toBeLessThan(MAX_FACTS_CHARS);
    expect(selectRelevantFacts(ALL_FACTS, 'anything at all')).toHaveLength(ALL_FACTS.length);
  });
});

describe('element questions — the third thing members reported wrong', () => {
  const ELEMENT_CASES: Array<[string, string]> = [
    ['what element is ice witch', 'hero-ice-witch-identity'],
    ['what element is sword master', 'hero-swordmaster-identity'],
    ['is starlight weaver xenoscape', 'hero-starlight-weaver-identity'],
    ['what element is blazing archer', 'hero-blazing-archer-identity'],
  ];
  for (const [question, needs] of ELEMENT_CASES) {
    it(`"${question}" retrieves ${needs}`, () => {
      expect([...retrievedKeys(question)]).toContain(needs);
    });
  }

  it('the element vocabulary facts survive an element question', () => {
    // The game calls the same element Electric, Electro and (for Frost) Ice.
    // Two facts explain that; without them the model treats the variants as
    // different elements.
    const got = retrievedKeys('what element is blazing archer');
    expect([...got]).toEqual(expect.arrayContaining(['elements-list']));
  });
});

describe('abbreviations — the actual origin of the "sword master is xeno" bug', () => {
  // A member wrote "SW is ideal". The bot read it as Swordmaster, called him a
  // Xeno hero, and built a whole team around that. The member meant Starlight
  // Weaver, who really is Xenoscape — so the wrong hero brought the wrong
  // element and the wrong role into the recommendation.
  it('the abbreviation table is in the knowledge base', () => {
    const keys = ALL_FACTS.map((f) => f.seedKey);
    expect(keys).toContain('hero-abbreviations');
    expect(keys).toContain('hero-abbreviations-ambiguous');
  });

  it('SW resolves to Starlight Weaver, not Swordmaster', () => {
    const table = ALL_FACTS.find((f) => f.seedKey === 'hero-abbreviations')!.text;
    expect(table).toMatch(/SW = Starlight Weaver/);
    expect(table).toMatch(/NOT Swordmaster/);
  });

  it('every unambiguous abbreviation maps to a hero that actually exists', () => {
    // A table listing a hero the roster does not have would send the bot
    // confidently to a nonexistent fact family.
    const table = ALL_FACTS.find((f) => f.seedKey === 'hero-abbreviations')!.text;
    const names = [...table.matchAll(/\b[A-Z]{2,3} = ([A-Z][a-zA-Z]*(?: [A-Z][a-zA-Z]*)*)/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(30);
    const roster = new Set(
      ALL_FACTS
        .map((f) => f.seedKey)
        .filter((k): k is string => Boolean(k?.startsWith('hero-') && k.endsWith('-identity')))
        .map((k) => k.slice('hero-'.length, -'-identity'.length)),
    );
    const missing = names.filter((n) => !roster.has(n.toLowerCase().replace(/ /g, '-')));
    expect(missing).toEqual([]);
  });

  it('asking about an abbreviation retrieves the table', () => {
    expect([...retrievedKeys('who is SW and is BA good with them')]).toContain('hero-abbreviations');
  });
});

describe('element discipline in team building', () => {
  it('the rule that off-element heroes must not pad an element team exists', () => {
    const fact = ALL_FACTS.find((f) => f.seedKey === 'strategy-element-team-discipline');
    expect(fact).toBeDefined();
    expect(fact!.text).toMatch(/must actually BE that element/);
  });

  it('a wind-team question retrieves it', () => {
    expect([...retrievedKeys('build me a good wind team')]).toContain('strategy-element-team-discipline');
  });
});

describe('the spine — facts every answer needs, never subject to scoring', () => {
  it('every spine key exists in the corpus', async () => {
    // A spine key that has been renamed silently stops being included, and the
    // failure is invisible: answers just get subtly worse.
    const { spineKeys } = await import('./retrieval.js');
    const present = new Set(ALL_FACTS.map((f) => f.seedKey));
    const missing = spineKeys().filter((k) => !present.has(k));
    expect(missing).toEqual([]);
  });

  it('the spine survives a question that matches none of it', async () => {
    const { spineKeys } = await import('./retrieval.js');
    // Deliberately about something unrelated to abbreviations or elements.
    const got = retrievedKeys('how much healing does the priest do per second');
    for (const k of spineKeys()) expect([...got]).toContain(k);
  });

  it('an abbreviation question now retrieves the table', () => {
    // "SW" and "BA" are two characters, below the tokenizer minimum, so this
    // could never be reached by scoring.
    expect([...retrievedKeys('who is SW and is BA good with them')]).toContain('hero-abbreviations');
  });

  it('the "what I do not know" fact is always present', () => {
    // Keeps the bot saying "I have no rune data" rather than inventing runes
    // once rune questions stop scoring against anything.
    expect([...retrievedKeys('anything at all about swordmaster')]).toContain('gap-runes-treasures-pantheon');
  });

  it('the spine is small enough to be free', () => {
    const spine = ALL_FACTS.filter((f) => f.seedKey && [
      'hero-abbreviations', 'hero-abbreviations-ambiguous', 'elements-list',
      'element-naming-variants', 'role-reading-a-heros-job',
      'strategy-element-team-discipline', 'gap-runes-treasures-pantheon',
    ].includes(f.seedKey));
    const chars = spine.reduce((n, f) => n + f.text.length, 0);
    expect(chars).toBeLessThan(6000);
  });
});

describe('the exact live multi-turn failure, against real facts', () => {
  it('Blazing Archer stays retrievable when the thread moved to Scarlet Reaper', () => {
    // Verbatim from #tempest-ai. peekaboo had been discussing a lineup, then
    // wrote a message about Scarlet Reaper only. Retrieval scored that message
    // alone, so Blazing Archer's team-buff passive was absent — and the bot
    // asserted he was "your main damage dealer" from its own earlier wording.
    // In the SAME reply it got Scarlet Reaper right, because she was named.
    const got = retrievedKeys(
      'Scarlet reaper has higher damage when health is higher. Check the facts',
      [
        'Is SR or BA my main damage dealer?',
        'Blazing Archer is typically your primary damage dealer, Scarlet Reaper supplements.',
      ],
    );
    expect([...got]).toContain('hero-blazing-archer-passive');
    expect([...got]).toContain('hero-blazing-archer-role');
    expect([...got]).toContain('hero-scarlet-reaper-passive');
  });

  it('and is NOT retrievable without that context — proving context did it', () => {
    const got = retrievedKeys('Scarlet reaper has higher damage when health is higher. Check the facts');
    expect([...got]).toContain('hero-scarlet-reaper-passive');
    expect([...got]).not.toContain('hero-blazing-archer-passive');
  });
});

describe('the corpus crossing the budget for the first time', () => {
  // The corpus sat at ~138k against a 140k budget when this was written, so the
  // NEXT batch of facts tips it over and selection engages in production for
  // the first time. An earlier check ran at 5x budget and passed, but that is
  // the easy case: far over budget, the scored fill is doing obvious work.
  //
  // Just barely over is the case with teeth. Pinned facts go in first and
  // unconditionally, then the remaining budget is filled in SCORE order — so
  // only a handful of facts get dropped, and they are the lowest-scoring ones.
  // A fact can score low and still be the only fact that answers a broad
  // question ("why do i have duplicate treasures"), which is exactly the shape
  // that has no entity name to pin on.
  //
  // The filler is deliberately written to LOOK like rune text so it competes on
  // keyword score instead of being trivially outranked.
  const RUNE_SHAPED_FILLER =
    'This treasure raises a hero ATK and HP and its upper tiers increase Final DMG for that skill. ';

  function corpusOverBudgetBy(extra: number): Fact[] {
    const out = [...ALL_FACTS];
    const total = () => out.reduce((n, f) => n + f.text.length, 0);
    let id = 800_000;
    while (total() < MAX_FACTS_CHARS + extra) {
      out.push({
        id: id++,
        text: RUNE_SHAPED_FILLER.repeat(4) + id,
        category: 'runes',
        status: 'approved',
        addedBy: '',
        addedByName: 'filler',
        addedAt: '2026-01-01T00:00:00.000Z',
        source: 'seed',
        seedKey: `filler-${id}`,
      });
    }
    return out;
  }

  // Broad questions with no entity to pin on — the ones genuinely at risk.
  const BROAD: Array<[string, string]> = [
    ['best treasures for the ice summon core', 'runes-for-the-ice-summon-core'],
    ['why do i have duplicate treasures', 'runes-fusion-rarity-up'],
    ['do treasures help all my heroes', 'runes-stats-vs-skills'],
    ['how many treasures can i carry', 'runes-carry-limit-and-slots'],
    ['what rarity are treasures', 'runes-rarity-ladder'],
    ['whats the best ice team', 'strategy-ice-summon-core'],
  ];

  for (const over of [2_000, 20_000, 100_000]) {
    it(`broad questions still reach their fact at ${over.toLocaleString()} chars over budget`, () => {
      const corpus = corpusOverBudgetBy(over);
      const total = corpus.reduce((n, f) => n + f.text.length, 0);
      expect(total, 'filler must actually push it over').toBeGreaterThan(MAX_FACTS_CHARS);

      const missing: string[] = [];
      for (const [question, needs] of BROAD) {
        const got = new Set(selectRelevantFacts(corpus, question).map((f) => f.seedKey));
        if (!got.has(needs)) missing.push(`"${question}" lost ${needs}`);
      }
      expect(missing).toEqual([]);
    });
  }

  it('the spine survives even when the corpus is far over budget', async () => {
    const { spineKeys } = await import('./retrieval.js');
    const corpus = corpusOverBudgetBy(100_000);
    const got = new Set(
      selectRelevantFacts(corpus, 'something completely unrelated to anything').map((f) => f.seedKey),
    );
    for (const k of spineKeys()) expect([...got]).toContain(k);
  });
});

describe('the "what I do not know" fact must not outlive the gap', () => {
  // gap-runes-treasures-pantheon is in the SPINE, so it goes into every single
  // prompt. The moment rune facts are added it becomes actively harmful: the
  // bot would hold rune data AND a standing instruction saying it has none, and
  // would most likely keep answering "I don't have any data yet on runes" while
  // the answer sits in the same prompt.
  //
  // This turns that silent future contradiction into a loud failure at exactly
  // the moment the first fact on one of these topics is written.
  const GAP_KEY = 'gap-runes-treasures-pantheon';
  const TOPICS: Array<[string, RegExp]> = [
    ['runes', /^runes?-/],
    ['treasures', /^treasures?-/],
    ['sigils', /^sigils?-/],
    ['gear', /^gear-/],
    ['emblems', /^emblems?-/],
    ['pantheon', /^pantheon-/],
  ];

  const gapFact = () => ALL_FACTS.find((f) => f.seedKey === GAP_KEY);

  it('the gap fact still exists and is in the spine', async () => {
    const { spineKeys } = await import('./retrieval.js');
    expect(gapFact()).toBeDefined();
    expect(spineKeys()).toContain(GAP_KEY);
  });

  for (const [topic, keyPattern] of TOPICS) {
    it(`if ${topic} facts exist, the gap fact no longer claims there are none`, () => {
      const contentFacts = ALL_FACTS.filter(
        (f) => f.seedKey && f.seedKey !== GAP_KEY && keyPattern.test(f.seedKey),
      );
      if (contentFacts.length === 0) return; // nothing added yet — nothing to check

      const text = gapFact()!.text.toLowerCase();
      // Once real content exists the topic must be removed from the "no data"
      // sentence. Update gap-runes-treasures-pantheon in the same commit that
      // adds the facts.
      expect(
        text.includes(`no data yet on`) && text.includes(topic),
        `${contentFacts.length} ${topic} fact(s) exist but ${GAP_KEY} still says the bot has no ${topic} data. Update it in the same commit.`,
      ).toBe(false);
    });
  }
});

describe('roster-by-element — one lookup instead of 45', () => {
  // The bot listed Seraph (Electric) under a "Fire Team" heading for a
  // beginner, unflagged, because verifying an element meant consulting 45
  // separate identity facts. This fact collapses that into one lookup.
  const roster = () => ALL_FACTS.find((f) => f.seedKey === 'roster-by-element');

  it('exists and is in the spine', async () => {
    const { spineKeys } = await import('./retrieval.js');
    expect(roster()).toBeDefined();
    expect(spineKeys()).toContain('roster-by-element');
  });

  it('agrees with every hero identity fact', () => {
    // If a hero's element changes, or a hero is added, this catches the drift
    // rather than letting the summary rot into a confident wrong answer.
    const text = roster()!.text;
    const mismatches: string[] = [];
    for (const f of ALL_FACTS) {
      const key = f.seedKey;
      if (!key?.startsWith('hero-') || !key.endsWith('-identity')) continue;
      const slug = key.slice('hero-'.length, -'-identity'.length);
      const name = slug.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
      const m = f.text.match(/\b(Fire|Wind|Ice|Frost|Electric|Xenoscape)\b/);
      if (!m) { mismatches.push(`${name}: no element in identity fact`); continue; }
      const el = m[1] === 'Frost' ? 'ICE/FROST' : m[1]!.toUpperCase();
      // The name must appear in its element's section of the summary.
      const section = text.split(/\b(?=FIRE \(|WIND \(|ICE\/FROST \(|ELECTRIC \(|XENOSCAPE \()/)
        .find((sec) => sec.startsWith(el));
      if (!section?.includes(name)) mismatches.push(`${name} (${el}) missing from that section`);
    }
    expect(mismatches).toEqual([]);
  });

  it('names Seraph as Electric, not Fire', () => {
    expect(roster()!.text).toMatch(/ELECTRIC[^.]*Seraph/);
  });

  it('a team question retrieves it', () => {
    expect([...retrievedKeys('hero team recommendations for beginners')]).toContain('roster-by-element');
  });
});

describe('the Ice summon core (from the guild owner)', () => {
  it('both facts exist and name the trio', () => {
    const core = ALL_FACTS.find((f) => f.seedKey === 'strategy-ice-summon-core');
    expect(core).toBeDefined();
    for (const hero of ['Northern Tyrant', 'Polar Captain', 'Frost Lich']) {
      expect(core!.text).toContain(hero);
    }
    expect(ALL_FACTS.find((f) => f.seedKey === 'strategy-ice-summon-flex-slots')).toBeDefined();
  });

  it('names Polar Captain as the damage dealer of the three', () => {
    const core = ALL_FACTS.find((f) => f.seedKey === 'strategy-ice-summon-core')!;
    expect(core.text).toMatch(/Polar Captain is the main damage dealer/);
  });

  it('all three are actually Ice, per their identity facts', () => {
    // A strategy fact naming an off-element hero is the exact mistake the
    // element-discipline rule exists to prevent, so the data must not make it.
    for (const slug of ['northern-tyrant', 'polar-captain', 'frost-lich']) {
      const id = ALL_FACTS.find((f) => f.seedKey === `hero-${slug}-identity`)!;
      expect(id.text, slug).toMatch(/\b(Ice|Frost)\b/);
    }
  });

  it('the numbers it quotes match the heroes\' own facts', () => {
    // Guards against the summary drifting from the source facts it summarises.
    const core = ALL_FACTS.find((f) => f.seedKey === 'strategy-ice-summon-core')!;
    const tyrant = ALL_FACTS.find((f) => f.seedKey === 'hero-northern-tyrant-passive')!;
    const lich = ALL_FACTS.find((f) => f.seedKey === 'hero-frost-lich-passive')!;
    expect(core.text).toContain('+36%');
    expect(tyrant.text).toContain('36%');
    expect(core.text).toContain('+45%');
    expect(lich.text).toContain('45%');
  });

  it('an ice-team question retrieves both', () => {
    const got = retrievedKeys('whats the best ice team');
    expect([...got]).toContain('strategy-ice-summon-core');
    expect([...got]).toContain('strategy-ice-summon-flex-slots');
  });
});
