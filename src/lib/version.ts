import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** package.json is the single version source of truth. */
export function readVersion(): string {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    // dist/lib/version.js and src/lib/version.ts are both two levels below the repo root.
    const pkg = JSON.parse(readFileSync(join(here, '..', '..', 'package.json'), 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
