export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  child(scope: string): Logger;
}

/**
 * Log listeners let infrastructure (e.g. the debug-logs Discord forwarder)
 * observe every emitted line without the logger knowing about Discord.
 */
export type LogListener = (level: LogLevel, line: string) => void;
const listeners: LogListener[] = [];
export function addLogListener(listener: LogListener): void {
  listeners.push(listener);
}

function format(level: LogLevel, scope: string, message: string, meta?: unknown): string {
  const time = new Date().toISOString();
  const base = `${time} [${level.toUpperCase()}]${scope ? ` (${scope})` : ''} ${message}`;
  if (meta === undefined) return base;
  if (meta instanceof Error) return `${base} :: ${meta.stack ?? meta.message}`;
  try {
    return `${base} :: ${JSON.stringify(meta)}`;
  } catch {
    return `${base} :: ${String(meta)}`;
  }
}

export function createLogger(minLevel: LogLevel = 'info', scope = ''): Logger {
  const emit = (level: LogLevel, message: string, meta?: unknown) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const line = format(level, scope, message, meta);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    for (const listener of listeners) {
      try {
        listener(level, line);
      } catch {
        // a broken listener must never break logging
      }
    }
  };
  return {
    debug: (m, meta) => emit('debug', m, meta),
    info: (m, meta) => emit('info', m, meta),
    warn: (m, meta) => emit('warn', m, meta),
    error: (m, meta) => emit('error', m, meta),
    child: (childScope) => createLogger(minLevel, scope ? `${scope}:${childScope}` : childScope),
  };
}
