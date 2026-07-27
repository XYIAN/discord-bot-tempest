import type { GuildConfig } from '../../config/guild.js';
import type { Fact } from './knowledge.js';

/** Keep the prompt bounded — the reference bot inlined its whole 50KB knowledge base on every call. */
const MAX_FACTS_CHARS = 12_000;

export function buildSystemPrompt(guild: GuildConfig, facts: Fact[], question: string): string {
  const { identity } = guild;
  const approved = facts.filter((f) => f.status === 'approved');
  const selected = selectRelevantFacts(approved, question);

  const factsByCategory = new Map<string, string[]>();
  for (const fact of selected) {
    const list = factsByCategory.get(fact.category) ?? [];
    list.push(fact.text);
    factsByCategory.set(fact.category, list);
  }
  const factSections = [...factsByCategory.entries()]
    .map(([category, texts]) => `### ${category}\n${texts.map((t) => `- ${t}`).join('\n')}`)
    .join('\n\n');

  return [
    `You are ${identity.botName}'s AI — the resident ${identity.gameName} expert for the ${identity.guildName} Discord community.`,
    '',
    'Personality: friendly, a little stormy-themed, loves theorycrafting. Keep answers concise (this is Discord — aim well under 1500 characters). Use the verified facts below as your primary source; general knowledge of Habby games (Archero-style roguelike mechanics) may fill gaps, but say when you are unsure rather than inventing specifics.',
    '',
    `Guild context: ${identity.guildName} recruits daily-active players at ${identity.requiredPower}+ power; guild leader is ${identity.guildLeader}. Suggest \`/guild apply\` when someone wants to join.`,
    '',
    'Members can teach you: `/fact add` proposes a fact, reviewed by moderators before you treat it as verified.',
    '',
    factSections ? `## Verified community facts\n\n${factSections}` : '## Verified community facts\n\n(none yet — encourage members to add some with /fact add)',
  ].join('\n');
}

/**
 * Cheap relevance filter: keyword-overlap score, keep highest scorers until
 * the budget is spent. No embeddings needed at this scale; swap this
 * function for retrieval if the knowledge base ever outgrows it.
 */
export function selectRelevantFacts(facts: Fact[], question: string): Fact[] {
  const total = facts.reduce((n, f) => n + f.text.length, 0);
  if (total <= MAX_FACTS_CHARS) return facts;

  const words = new Set(
    question
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
  const scored = facts
    .map((fact) => {
      const factWords = fact.text.toLowerCase().split(/[^a-z0-9]+/);
      const score = factWords.filter((w) => words.has(w)).length;
      return { fact, score };
    })
    .sort((a, b) => b.score - a.score);

  const selected: Fact[] = [];
  let used = 0;
  for (const { fact } of scored) {
    if (used + fact.text.length > MAX_FACTS_CHARS) continue;
    selected.push(fact);
    used += fact.text.length;
  }
  return selected;
}
