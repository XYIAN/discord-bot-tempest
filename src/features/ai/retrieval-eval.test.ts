import { describe, expect, it } from 'vitest';
import { selectRelevantFacts } from './prompt.js';
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
];

function retrievedKeys(question: string): Set<string> {
  return new Set(
    selectRelevantFacts(ALL_FACTS, question)
      .map((f) => f.seedKey)
      .filter((k): k is string => Boolean(k)),
  );
}

describe('retrieval reaches the fact that answers the question', () => {
  it('the corpus is large enough that selection is actually active', () => {
    // If this ever goes false the whole selection path stops running and these
    // tests silently pass for the wrong reason.
    const total = ALL_FACTS.reduce((n, f) => n + f.text.length, 0);
    expect(ALL_FACTS.length).toBeGreaterThan(300);
    expect(total).toBeGreaterThan(100_000);
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

describe('the budget is not the binding constraint it was', () => {
  it('a plain hero question retrieves a useful share of the corpus', () => {
    // At MAX_FACTS_CHARS = 12,000 against ~105,000 chars of facts, any question
    // saw about 11% of what the bot knows.
    const selected = selectRelevantFacts(ALL_FACTS, 'tell me about swordmaster');
    const share = selected.length / ALL_FACTS.length;
    expect(share).toBeGreaterThan(0.5);
  });
});
