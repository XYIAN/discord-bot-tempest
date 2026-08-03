import { describe, expect, it } from 'vitest';
import { guildConfig } from '../../config/guild.js';
import {
  buildDocuments,
  documentHash,
  documentsNeedingPublish,
  type PolicyState,
} from './documents.js';

const guild = guildConfig;
const docs = buildDocuments(guild);
const empty: PolicyState = { docs: {} };

function stateFor(list = docs): PolicyState {
  return {
    docs: Object.fromEntries(
      list.map((d) => [d.key, { messageId: 'm', channelId: 'c', hash: documentHash(d) }]),
    ),
  };
}

describe('buildDocuments', () => {
  it('produces exactly the two documents, one per channel', () => {
    expect(docs.map((d) => d.key)).toEqual(['rules', 'terms']);
    expect(docs.map((d) => d.channel)).toEqual(['rules', 'terms']);
  });

  it('uses unique keys', () => {
    expect(new Set(docs.map((d) => d.key)).size).toBe(docs.length);
  });

  it('fits inside a Discord embed description', () => {
    for (const doc of docs) expect(doc.body.length).toBeLessThan(4096);
  });

  it('pulls guild identity from config rather than hardcoding it', () => {
    const custom = buildDocuments({
      ...guild,
      identity: { ...guild.identity, guildName: 'Zephyr', botName: 'Zephyr Bot' },
    });
    expect(custom.find((d) => d.key === 'rules')!.body).toContain('Zephyr');
    expect(custom.find((d) => d.key === 'terms')!.body).toContain('Zephyr Bot');
  });

  it('covers the rules the owner asked for', () => {
    const rules = docs.find((d) => d.key === 'rules')!.body.toLowerCase();
    expect(rules).toContain('soliciting');
    expect(rules).toContain('selling'); // no account/currency sales
    expect(rules).toContain('spam');
    expect(rules).toContain('discord');
  });

  it('states what is kept and that third parties are involved, without naming vendors', () => {
    const terms = docs.find((d) => d.key === 'terms')!.body;
    expect(terms).toContain('user ID');
    expect(terms.toLowerCase()).toContain('third-party language model');
    // Deliberately vendor-agnostic: the owner asked not to name providers, so
    // swapping the LLM behind the bot never makes this document wrong.
    expect(terms).not.toMatch(/OpenAI|Anthropic|Claude|GPT|Gemini/i);
    // And free of implementation detail — no infrastructure or storage internals.
    expect(terms).not.toMatch(/Railway|JSON|database|\bvolume\b|\bAPI\b|webhook/i);
  });
});

describe('documentHash', () => {
  it('is stable for identical content', () => {
    expect(documentHash(docs[0]!)).toBe(documentHash({ ...docs[0]! }));
  });

  it('changes when the body changes', () => {
    expect(documentHash({ ...docs[0]!, body: 'different' })).not.toBe(documentHash(docs[0]!));
  });

  it('changes when only the title changes', () => {
    expect(documentHash({ ...docs[0]!, title: 'Other' })).not.toBe(documentHash(docs[0]!));
  });
});

describe('documentsNeedingPublish', () => {
  it('publishes everything on a fresh server', () => {
    expect(documentsNeedingPublish(docs, empty)).toHaveLength(2);
  });

  it('publishes nothing when content is unchanged — a redeploy must not churn', () => {
    expect(documentsNeedingPublish(docs, stateFor())).toEqual([]);
  });

  it('publishes only the document whose text actually changed', () => {
    const state = stateFor();
    const edited = docs.map((d) => (d.key === 'terms' ? { ...d, body: 'updated terms' } : d));
    const needed = documentsNeedingPublish(edited, state);
    expect(needed.map((d) => d.key)).toEqual(['terms']);
  });

  it('publishes a document that was never published, leaving the others alone', () => {
    const partial: PolicyState = { docs: { ...stateFor().docs } };
    delete partial.docs.terms;
    expect(documentsNeedingPublish(docs, partial).map((d) => d.key)).toEqual(['terms']);
  });
});
