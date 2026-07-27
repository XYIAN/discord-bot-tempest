import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../core/logger.js';
import { createStoreProvider } from './json-store.js';

describe('JsonFileStore', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tempest-store-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  function provider() {
    return createStoreProvider(dir, createLogger('error'));
  }

  it('returns defaults when no file exists', async () => {
    const store = provider().store('missing', { count: 0 });
    expect(await store.get()).toEqual({ count: 0 });
  });

  it('persists and reloads values across provider instances', async () => {
    await provider().store('numbers', { count: 0 }).set({ count: 42 });
    expect(await provider().store('numbers', { count: 0 }).get()).toEqual({ count: 42 });
  });

  it('serializes concurrent updates without losing writes', async () => {
    const store = provider().store('counter', { count: 0 });
    await Promise.all(
      Array.from({ length: 25 }, () =>
        store.update((s) => {
          s.count += 1;
          return s;
        }),
      ),
    );
    expect((await store.get()).count).toBe(25);
  });

  it('writes valid JSON to disk', async () => {
    await provider().store('shape', { a: [1, 2] }).set({ a: [3] });
    const raw = await readFile(join(dir, 'shape.json'), 'utf8');
    expect(JSON.parse(raw)).toEqual({ a: [3] });
  });

  it('does not leak mutations between callers (defensive clone)', async () => {
    const defaults = { list: [] as string[] };
    const store = provider().store('clone', defaults);
    await store.update((s) => {
      s.list.push('x');
      return s;
    });
    expect(defaults.list).toEqual([]);
  });
});
