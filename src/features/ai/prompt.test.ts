import { describe, expect, it } from 'vitest';
import { guildConfig } from '../../config/guild.js';
import type { Fact } from './knowledge.js';
import { buildSystemPrompt, selectRelevantFacts } from './prompt.js';

function fact(id: number, text: string, category = 'general', status: Fact['status'] = 'approved'): Fact {
  return { id, text, category, status, addedBy: 'u', addedByName: 'u', addedAt: '', source: 'command' };
}

describe('buildSystemPrompt', () => {
  it('includes approved facts and excludes pending/rejected', () => {
    const prompt = buildSystemPrompt(
      guildConfig,
      [fact(1, 'Drakaina is strong'), fact(2, 'unverified thing', 'general', 'pending')],
      'who is strong?',
    );
    expect(prompt).toContain('Drakaina is strong');
    expect(prompt).not.toContain('unverified thing');
  });

  it('mentions the guild identity', () => {
    const prompt = buildSystemPrompt(guildConfig, [], 'hi');
    expect(prompt).toContain('Tempest');
    expect(prompt).toContain('Wittle Defender');
    expect(prompt).toContain('XYIAN');
  });
});

describe('an abbreviated question retrieves that hero — not just names him', () => {
  // The two fixes did not compose. Abbreviations resolve "SW" to Starlight
  // Weaver and state it at the top of the prompt, but retrieval was running on
  // the RAW question, where "SW" is two characters — below the tokenizer
  // minimum and the 4-char floor in heroesMentioned — so it matched nothing.
  //
  // Harmless while the whole corpus fit in one prompt; the facts were there
  // regardless. The moment the corpus outgrew the budget it became the worst
  // case: measured against the real corpus, "is SW worth building?" retrieved
  // ZERO Starlight Weaver facts while the prompt declared "SW = Starlight
  // Weaver" above them. Right hero named, no data — the exact shape that makes
  // a model invent.
  const realCorpus = async (): Promise<Fact[]> => {
    const { SEED_FACTS } = await import('./seed-facts.js');
    return SEED_FACTS.map((s, i) => ({
      id: i + 1,
      text: s.text,
      category: s.category,
      status: 'approved' as const,
      addedBy: '',
      addedByName: 'seed',
      addedAt: '2026-01-01T00:00:00.000Z',
      source: 'seed' as const,
      seedKey: s.key,
    }));
  };

  it('"is SW worth building?" pulls in Starlight Weaver facts, not just the notice', async () => {
    const facts = await realCorpus();
    const prompt = buildSystemPrompt(guildConfig, facts, 'is SW worth building?');
    expect(prompt).toContain('SW = Starlight Weaver');
    // Assert on content ONLY her own facts carry. Counting the words
    // "Starlight Weaver" passes for the wrong reason — the abbreviation table
    // and roster-by-element are spine facts and name her whatever happens.
    // "Starlit Fall" is her Main Skill and appears nowhere else.
    expect(prompt).toContain('Starlit Fall');
    expect(prompt).toContain('Stella');
  });

  it('the same question spelled out is not materially better served', async () => {
    // The point of the fix: initials and the full name should retrieve the
    // same hero. Previously the abbreviated form got zero of her facts.
    const facts = await realCorpus();
    const abbr = buildSystemPrompt(guildConfig, facts, 'is SW worth building?');
    const full = buildSystemPrompt(guildConfig, facts, 'is Starlight Weaver worth building?');
    const count = (p: string) => (p.match(/Starlight Weaver/g) ?? []).length;
    expect(count(abbr)).toBeGreaterThanOrEqual(count(full) - 2);
  });

  it('ambiguous initials bring in every candidate so the bot can ask usefully', async () => {
    const facts = await realCorpus();
    const prompt = buildSystemPrompt(guildConfig, facts, 'what about FL');
    expect(prompt).toMatch(/MUST ask which hero is meant/);
    // Both candidates' facts present, so the question it asks is informed.
    expect((prompt.match(/Frost Lich/g) ?? []).length).toBeGreaterThan(3);
    expect((prompt.match(/Fabled Lyra/g) ?? []).length).toBeGreaterThan(3);
  });

  it('a question with no abbreviations is unchanged', async () => {
    const facts = await realCorpus();
    const prompt = buildSystemPrompt(guildConfig, facts, 'what is the best ice team');
    expect(prompt).not.toContain('ABBREVIATIONS IN THIS MESSAGE');
  });
});

describe('selectRelevantFacts', () => {
  it('returns everything under budget', () => {
    const facts = [fact(1, 'a'), fact(2, 'b')];
    expect(selectRelevantFacts(facts, 'anything')).toHaveLength(2);
  });

  it('prefers keyword-matching facts when over budget', () => {
    const filler = Array.from({ length: 30 }, (_, i) => fact(i, `filler about nothing relevant ${'x'.repeat(500)} ${i}`));
    const relevant = fact(999, 'Drakaina scales with fire damage runes');
    const selected = selectRelevantFacts([...filler, relevant], 'best runes for Drakaina fire build?');
    expect(selected.map((f) => f.id)).toContain(999);
  });
});
