import type { Message } from 'discord.js';
import type { BotContext } from '../../core/types.js';
import type { ChatTurn, ContentPart, LlmClient } from '../../lib/llm/index.js';
import { turnToText } from '../../lib/llm/index.js';
import { collectImageAttachments } from '../../lib/llm/attachments.js';
import { recordAiQuestion } from '../../lib/achievements/service.js';
import { isHumanGuildMessage } from '../../lib/discord/message.js';
import { memberHasRole, resolveRole, resolveTextChannel } from '../../lib/discord/resolve.js';
import { knowledgeStore } from './knowledge.js';
import { buildSystemPrompt } from './prompt.js';

const COOLDOWN_MS = 20_000;
const MEMORY_TURNS = 6; // 3 exchanges
const MEMORY_TTL_MS = 15 * 60 * 1000;
const MAX_ANSWER_TOKENS = 700;
const MAX_QUESTION_CHARS = 600;
const DAILY_QUESTION_LIMIT = 40;

interface ConversationState {
  /** Per-user rolling history — persisted so redeploys don't wipe context. */
  users: Record<string, { turns: ChatTurn[]; lastAt: number }>;
  /** Per-user daily question counts, keyed by YYYY-MM-DD. */
  daily: { date: string; counts: Record<string, number> };
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
const EMPTY_CONVERSATIONS: ConversationState = { users: {}, daily: { date: '', counts: {} } };

export function qaLogStore(ctx: BotContext) {
  return ctx.stores.store<QaLogState>('qa-log', { entries: [] });
}

const cooldowns = new Map<string, number>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function handleAiMessage(
  ctx: BotContext,
  llm: LlmClient,
  message: Message,
): Promise<void> {
  if (!isHumanGuildMessage(message, ctx.config.guildId)) return;
  // Resolve the configured channel by id, not raw name comparison, so a
  // renamed impostor channel can't route traffic to the LLM.
  const aiChannel = resolveTextChannel(message.guild, ctx.guild.channels.aiChat);
  if (!aiChannel || message.channelId !== aiChannel.id) return;
  const question = message.content.trim().slice(0, MAX_QUESTION_CHARS);
  if (question.startsWith('/')) return;
  // A screenshot with no caption is a perfectly normal question ("here's my
  // roster") — so only bail when there's neither text nor an attachment.
  const hasAttachments = message.attachments.size > 0;
  if (!question && !hasAttachments) return;

  // The aiEnabled role is the per-user kill switch. It's auto-granted on
  // join; if the role doesn't exist on the server, the gate is open.
  const aiRole = resolveRole(message.guild, ctx.guild.roles.aiEnabled);
  if (aiRole && message.member && !memberHasRole(message.member, ctx.guild.roles.aiEnabled)) {
    return;
  }

  const last = cooldowns.get(message.author.id) ?? 0;
  if (Date.now() - last < COOLDOWN_MS) {
    await message.react('⏳').catch(() => undefined);
    return;
  }
  cooldowns.set(message.author.id, Date.now());

  const log = ctx.logger.child('ai');
  const conversations = ctx.stores.store<ConversationState>('conversations', EMPTY_CONVERSATIONS);

  // Daily budget check+increment inside one atomic update.
  let overBudget = false;
  await conversations.update((s) => {
    if (s.daily.date !== today()) s.daily = { date: today(), counts: {} };
    const count = s.daily.counts[message.author.id] ?? 0;
    if (count >= DAILY_QUESTION_LIMIT) overBudget = true;
    else s.daily.counts[message.author.id] = count + 1;
    return s;
  });
  if (overBudget) {
    await message.react('🌙').catch(() => undefined);
    return;
  }

  await message.channel.sendTyping().catch(() => undefined);

  const state = await conversations.get();
  const existing = state.users[message.author.id];
  const history = existing && Date.now() - existing.lastAt < MEMORY_TTL_MS ? existing.turns : [];

  const knowledge = await knowledgeStore(ctx).get();
  // Retrieval must see what the MODEL sees. Scoring the current message alone
  // meant that in a multi-turn thread the model kept discussing heroes whose
  // facts had been dropped several turns back, and answered from its own
  // earlier wording rather than from data — which is how it insisted Blazing
  // Archer was a main damage dealer when his team-buff passive was absent.
  const contextText = history.map((t) => turnToText(t.content));
  const system = buildSystemPrompt(
    ctx.guild,
    knowledge.facts,
    question,
    hasAttachments,
    contextText,
  );

  // Screenshots are the most common way members ask about their own roster.
  const { images, skipped } = hasAttachments
    ? await collectImageAttachments(message, log)
    : { images: [], skipped: [] as string[] };
  if (images.length > 0 && !llm.supportsImages) {
    await message.reply("I can't read screenshots on my current model — describe it in text and I'll help. ⛈️");
    return;
  }

  const userContent: string | ContentPart[] =
    images.length > 0
      ? [{ type: 'text', text: question || 'What can you tell me about this screenshot?' }, ...images]
      : question;

  let answer: string;
  try {
    answer = await llm.complete({
      system,
      turns: [...history, { role: 'user', content: userContent }],
      maxTokens: MAX_ANSWER_TOKENS,
    });
  } catch (error) {
    log.error('LLM completion failed', error);
    const detail = error instanceof Error ? error.message : String(error);
    const outOfCredits = detail.includes('insufficient_quota') || detail.includes('credit balance');
    await message.reply(
      outOfCredits
        ? 'Tempest AI is out of energy — the API account needs credits. The storm council has been notified. ⚡'
        : 'Storm interference — I could not reach my brain. Try again in a minute. ⛈️',
    );
    return;
  }
  if (!answer) return;

  // Tell the member when an attachment was ignored, so a missing answer
  // doesn't look like the bot silently failed.
  const note = skipped.length > 0 ? `\n\n-# Skipped: ${skipped.join('; ')}` : '';

  // Model output is user-influenced — never let it ping anyone.
  await message.reply({ content: (answer + note).slice(0, 1990), allowedMentions: { parse: [] } });

  await conversations.update((s) => {
    // Append onto the state as it is NOW (not the pre-LLM snapshot).
    const current = s.users[message.author.id];
    const base = current && Date.now() - current.lastAt < MEMORY_TTL_MS ? current.turns : [];
    // Persist the TEXT form only — base64 images would bloat the store on disk.
    const historyText = images.length > 0 ? `${question || '(screenshot)'} [${images.length} screenshot(s)]` : question;
    const turns = [...base, { role: 'user' as const, content: historyText }, { role: 'assistant' as const, content: answer.slice(0, 1500) }];
    s.users[message.author.id] = { turns: turns.slice(-MEMORY_TURNS), lastAt: Date.now() };
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
