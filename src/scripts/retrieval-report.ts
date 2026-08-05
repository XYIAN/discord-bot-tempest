/**
 * What actually reaches the model for a given question.
 *
 * Run:  npx tsx src/scripts/retrieval-report.ts ["a question"]
 *
 * Exists because the bot was answering confidently and wrongly while the
 * correct facts sat in seed-facts.ts untouched. When that happens again, this
 * says in one command whether the fact reached the prompt at all — which is a
 * completely different bug from the model misreading a fact it was given.
 */
import { SEED_FACTS } from '../features/ai/seed-facts.js';
import { selectRelevantFacts, MAX_FACTS_CHARS } from '../features/ai/retrieval.js';
import type { Fact } from '../features/ai/knowledge.js';

const ALL: Fact[] = SEED_FACTS.map((s, i) => ({
  id: i + 1,
  text: s.text,
  category: s.category,
  status: 'approved',
  addedBy: '',
  addedByName: 'seed',
  addedAt: '',
  source: 'seed',
  seedKey: s.key,
}));

const total = ALL.reduce((n, f) => n + f.text.length, 0);
console.log(`corpus: ${ALL.length} facts, ${total.toLocaleString()} chars (~${Math.round(total / 4).toLocaleString()} tokens)`);
console.log(`budget: ${MAX_FACTS_CHARS.toLocaleString()} chars — ${total <= MAX_FACTS_CHARS ? 'whole corpus fits, selection idle' : 'selection active'}`);

const questions = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      'is sword master a xenoscape hero?',
      'is blazing archer a good main dps?',
      'what element is ice witch',
      'whats a good wind team',
    ];

for (const q of questions) {
  const sel = selectRelevantFacts(ALL, q);
  const chars = sel.reduce((n, f) => n + f.text.length, 0);
  const heroKeys = sel.map((f) => f.seedKey).filter((k) => k?.startsWith('hero-'));
  console.log(`\n"${q}"`);
  console.log(`  ${sel.length}/${ALL.length} facts, ${chars.toLocaleString()} chars`);
  console.log(`  hero facts included: ${heroKeys.slice(0, 8).join(', ')}${heroKeys.length > 8 ? ` … +${heroKeys.length - 8}` : ''}`);
}
