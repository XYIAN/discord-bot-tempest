import { createServer, type Server } from 'node:http';
import type { Client } from 'discord.js';
import type { Logger } from './logger.js';

/**
 * Minimal /health endpoint for Railway. Plain node http — no framework
 * needed for a single route. Started before Discord login so the deploy
 * health check passes even while the gateway connects (or is degraded).
 */
export function startHealthServer(
  port: number,
  client: Client,
  version: string,
  logger: Logger,
  getDegradedReason: () => string | undefined,
): Server {
  const startedAt = Date.now();
  const server = createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      const degraded = getDegradedReason();
      // 503 when login has permanently failed so the deploy is visibly
      // unhealthy instead of a green-but-zombie service.
      res.writeHead(degraded ? 503 : 200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: degraded ? 'degraded' : 'ok',
          ...(degraded ? { degraded_reason: degraded } : {}),
          version,
          uptime_seconds: Math.floor((Date.now() - startedAt) / 1000),
          discord_ready: client.isReady(),
        }),
      );
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(port, () => logger.info(`Health server listening on :${port}`));
  return server;
}
