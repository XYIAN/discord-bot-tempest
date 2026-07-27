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
