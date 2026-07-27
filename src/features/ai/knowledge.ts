import type { BotContext } from '../../core/types.js';
import type { Store } from '../../lib/store/json-store.js';

export type FactStatus = 'pending' | 'approved' | 'rejected';

export interface Fact {
  /** Stable id — never an array index. */
  id: number;
  text: string;
  category: string;
  status: FactStatus;
  addedBy: string;
  addedByName: string;
  addedAt: string;
  source: 'command' | 'memory-sync';
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface KnowledgeState {
  nextId: number;
  facts: Fact[];
}

export const CATEGORIES = [
  'heroes',
  'runes',
  'gear',
  'treasures',
  'game-modes',
  'events',
  'guild',
  'economy',
  'strategy',
  'general',
] as const;

export function knowledgeStore(ctx: BotContext): Store<KnowledgeState> {
  return ctx.stores.store<KnowledgeState>('knowledge', { nextId: 1, facts: [] });
}

export async function addFact(
  ctx: BotContext,
  input: Omit<Fact, 'id' | 'addedAt'>,
): Promise<Fact> {
  let created!: Fact;
  await knowledgeStore(ctx).update((state) => {
    created = { ...input, id: state.nextId, addedAt: new Date().toISOString() };
    state.nextId += 1;
    state.facts.push(created);
    return state;
  });
  return created;
}

export interface FactStatusChange {
  fact: Fact;
  /** false when the fact was already in the requested status (no-op). */
  changed: boolean;
}

export async function setFactStatus(
  ctx: BotContext,
  id: number,
  status: FactStatus,
  reviewerId: string,
): Promise<FactStatusChange | undefined> {
  let result: FactStatusChange | undefined;
  await knowledgeStore(ctx).update((state) => {
    const fact = state.facts.find((f) => f.id === id);
    if (fact) {
      const changed = fact.status !== status;
      if (changed) {
        fact.status = status;
        fact.reviewedBy = reviewerId;
        fact.reviewedAt = new Date().toISOString();
      }
      result = { fact, changed };
    }
    return state;
  });
  return result;
}

export async function removeFact(ctx: BotContext, id: number): Promise<boolean> {
  let removed = false;
  await knowledgeStore(ctx).update((state) => {
    const before = state.facts.length;
    state.facts = state.facts.filter((f) => f.id !== id);
    removed = state.facts.length < before;
    return state;
  });
  return removed;
}

export async function approvedFactCountByUser(ctx: BotContext, userId: string): Promise<number> {
  const state = await knowledgeStore(ctx).get();
  return state.facts.filter((f) => f.status === 'approved' && f.addedBy === userId).length;
}

/** Case-insensitive substring check against existing facts to avoid dupes. */
export function isDuplicate(state: KnowledgeState, text: string): boolean {
  const normalized = text.toLowerCase().replace(/[’']/g, "'").slice(0, 60);
  return state.facts.some(
    (f) =>
      f.status !== 'rejected' &&
      f.text.toLowerCase().replace(/[’']/g, "'").includes(normalized.slice(0, 40)),
  );
}
