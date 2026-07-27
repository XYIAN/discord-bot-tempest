import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Logger } from '../../core/logger.js';

/**
 * A tiny persistent document store: one JSON file per named store,
 * atomic writes (tmp file + rename), serialized updates.
 *
 * Deliberately simple — if the bot ever outgrows JSON files, implement
 * StoreProvider over a real database and nothing else changes.
 */
export interface Store<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
  update(mutate: (current: T) => T | Promise<T>): Promise<T>;
}

export interface StoreProvider {
  store<T>(name: string, defaults: T): Store<T>;
}

class JsonFileStore<T> implements Store<T> {
  private cache: T | undefined;
  private chain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly defaults: T,
    private readonly logger: Logger,
  ) {}

  /** Serialize all operations so concurrent updates can't interleave. */
  private enqueue<R>(op: () => Promise<R>): Promise<R> {
    const next = this.chain.then(op, op);
    this.chain = next.catch(() => undefined);
    return next;
  }

  private async load(): Promise<T> {
    if (this.cache !== undefined) return this.cache;
    try {
      const raw = await readFile(this.filePath, 'utf8');
      this.cache = JSON.parse(raw) as T;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        this.logger.error(`Failed to read store ${this.filePath}; using defaults`, error);
      }
      this.cache = structuredClone(this.defaults);
    }
    return this.cache;
  }

  private async persist(value: T): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
    await rename(tmp, this.filePath);
  }

  get(): Promise<T> {
    return this.enqueue(() => this.load());
  }

  set(value: T): Promise<void> {
    return this.enqueue(async () => {
      this.cache = value;
      await this.persist(value);
    });
  }

  update(mutate: (current: T) => T | Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      const current = await this.load();
      const next = await mutate(structuredClone(current));
      this.cache = next;
      await this.persist(next);
      return next;
    });
  }
}

export function createStoreProvider(dataDir: string, logger: Logger): StoreProvider {
  const stores = new Map<string, JsonFileStore<unknown>>();
  return {
    store<T>(name: string, defaults: T): Store<T> {
      let existing = stores.get(name);
      if (!existing) {
        existing = new JsonFileStore(join(dataDir, `${name}.json`), defaults, logger.child(`store:${name}`));
        stores.set(name, existing);
      }
      return existing as unknown as Store<T>;
    },
  };
}
