import type { Message } from 'discord.js';
import type { BotContext } from '../../core/types.js';
import type { ChatTurn, LlmClient } from '../../lib/llm/index.js';
import { recordAiQuestion } from '../../lib/achievements/service.js';
import { knowledgeStore } from './knowledge.js';
import { buildSystemPrompt } from './prompt.js';

const COOLDOWN_MS = 20_000;
const MEMORY_TURNS = 6; // 3 exchanges
const MEMORY_TTL_MS = 15 * 60 * 1000;
const MAX_ANSWER_TOKENS = 700;

interface ConversationState {
  /** Per-user rolling history — persisted so redeploys don't wipe context. */
  users: Record<string, { turns: ChatTurn[]; lastAt: number }>;
}

export interface QaLogEntry {
  userId: string;
  question: string;
  answer: string;
  at: string;
}

interface QaLogState {
  entries: QaLogEntry[];
}

const MAX_QA_LOG = 200;

export function qaLogStore(ctx: BotContext) {
  return ctx.stores.store<QaLogState>('qa-log', { entries: [] });
}

const cooldowns = new Map<string, number>();

export async function handleAiMessage(
  ctx: BotContext,
  llm: LlmClient,
  message: Message,
): Promise<void> {
  if (message.author.bot || !message.inGuild() || message.guildId !== ctx.config.guildId) return;
  const channelName = 'name' in message.channel ? (message.channel.name ?? '') : '';
  if (channelName !== ctx.guild.channels.aiChat.name) return;
  const question = message.content.trim();
  if (!question || question.startsWith('/')) return;

  const last = cooldowns.get(message.author.id) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) {
    await message.react('⏳').catch(() => undefined);
    return;
  }
  cooldowns.set(message.author.id, Date.now());

  const log = ctx.logger.child('ai');
  await message.channel.sendTyping().catch(() => undefined);

  const conversations = ctx.stores.store<ConversationState>('conversations', { users: {} });
  const state = await conversations.get();
  const existing = state.users[message.author.id];
  const history = existing && Date.now() - existing.lastAt < MEMORY_TTL_MS ? existing.turns : [];

  const knowledge = await knowledgeStore(ctx).get();
  const system = buildSystemPrompt(ctx.guild, knowledge.facts, question);

  let answer: string;
  try {
    answer = await llm.complete({
      system,
      turns: [...history, { role: 'user', content: question }],
      maxTokens: MAX_ANSWER_TOKENS,
    });
  } catch (error) {
    log.error('LLM completion failed', error);
    await message.reply('Storm interference — I could not reach my brain. Try again in a minute. ⛈️');
    return;
  }
  if (!answer) return;

  await message.reply(answer.slice(0, 1990));

  await conversations.update((s) => {
    const turns = [...history, { role: 'user' as const, content: question }, { role: 'assistant' as const, content: answer }];
    s.users[message.author.id] = { turns: turns.slice(-MEMORY_TURNS), lastAt: Date.now() };
    // Prune expired users so the file doesn't grow forever.
    for (const [userId, record] of Object.entries(s.users)) {
      if (Date.now() - record.lastAt > MEMORY_TTL_MS) delete s.users[userId];
    }
    return s;
  });

  await qaLogStore(ctx).update((s) => {
    s.entries.push({
      userId: message.author.id,
      question: question.slice(0, 500),
      answer: answer.slice(0, 800),
      at: new Date().toISOString(),
    });
    if (s.entries.length > MAX_QA_LOG) s.entries = s.entries.slice(-MAX_QA_LOG);
    return s;
  });

  await recordAiQuestion(ctx, message.author.id);
}
