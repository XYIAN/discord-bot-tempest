import type { BotContext } from '../../core/types.js';
import type { LlmClient } from '../../lib/llm/index.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';
import { sendToChannel, stormEmbed } from '../../lib/discord/send.js';
import { qaLogStore } from './chat.js';
import { addFact, CATEGORIES, isDuplicate, knowledgeStore } from './knowledge.js';

const MAX_CANDIDATES_PER_SYNC = 5;

/**
 * The autonomous version of the reference bot's manual sync-facts CLI:
 * nightly, the LLM reads the day's Q&A log, extracts durable game facts the
 * knowledge base doesn't already have, and files them as *pending* facts
 * for moderator review. The AI's memory grows as people use it — with a
 * human gate before anything becomes "verified".
 */
export async function runMemorySync(ctx: BotContext, llm: LlmClient): Promise<void> {
  const log = ctx.logger.child('memory-sync');
  const qaStore = qaLogStore(ctx);
  const { entries } = await qaStore.get();
  if (entries.length < 3) {
    log.info(`Skipping memory sync — only ${entries.length} Q&A entries logged`);
    return;
  }

  const knowledge = await knowledgeStore(ctx).get();
  const existingFacts = knowledge.facts
    .filter((f) => f.status !== 'rejected')
    .map((f) => `- ${f.text}`)
    .join('\n');
  const transcript = entries
    .map((e) => `Q: ${e.question}\nA: ${e.answer}`)
    .join('\n---\n')
    .slice(0, 20_000);

  const system = [
    `You extract durable, verifiable facts about the game ${ctx.guild.identity.gameName} (by Habby) from community Q&A transcripts.`,
    'Return STRICT JSON only: an array of at most ' + MAX_CANDIDATES_PER_SYNC + ' objects, each {"text": string, "category": string}.',
    `Valid categories: ${CATEGORIES.join(', ')}.`,
    'Rules: only include game facts that were asserted with confidence and are NOT in the known-facts list; never include opinions, user-specific info, or anything the assistant hedged on. Return [] when nothing qualifies.',
  ].join('\n');

  let raw: string;
  try {
    raw = await llm.complete({
      system,
      turns: [
        {
          role: 'user',
          content: `Known facts:\n${existingFacts || '(none)'}\n\nTranscript:\n${transcript}`,
        },
      ],
      maxTokens: 1000,
    });
  } catch (error) {
    log.error('Memory sync LLM call failed', error);
    return;
  }

  const candidates = parseCandidates(raw);
  const fresh = candidates.filter((c) => !isDuplicate(knowledge, c.text));
  let filed = 0;
  for (const candidate of fresh.slice(0, MAX_CANDIDATES_PER_SYNC)) {
    await addFact(ctx, {
      text: candidate.text.slice(0, 500),
      category: (CATEGORIES as readonly string[]).includes(candidate.category) ? candidate.category : 'general',
      status: 'pending',
      addedBy: '',
      addedByName: 'memory-sync',
      source: 'memory-sync',
    });
    filed++;
  }

  // Clear the processed log so the next sync only sees new conversations.
  await qaStore.set({ entries: [] });
  log.info(`Memory sync complete: ${candidates.length} candidates, ${filed} filed for review`);

  if (filed > 0) {
    const guild = getHomeGuild(ctx);
    if (guild) {
      await sendToChannel(
        guild,
        ctx.guild.channels.botLogs,
        {
          embeds: [
            stormEmbed(
              '🧠 Memory sync',
              `Extracted **${filed}** candidate fact${filed === 1 ? '' : 's'} from today's conversations.\nReview with \`/fact list status:pending\`, then \`/fact approve <id>\`.`,
            ),
          ],
        },
        log,
      );
    }
  }
}

export function parseCandidates(raw: string): { text: string; category: string }[] {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is { text: string; category: string } =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as { text?: unknown }).text === 'string' &&
          typeof (item as { category?: unknown }).category === 'string',
      )
      .filter((item) => item.text.trim().length > 10);
  } catch {
    return [];
  }
}
