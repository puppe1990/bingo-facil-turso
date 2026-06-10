import type { Plugin } from 'vite';

const SERVER_FN_FILES = ['src/server/auth.functions.ts', 'src/server/events.functions.ts'] as const;

/**
 * TanStack Start can throw "Invalid server function ID" after a dev-server
 * restart until server-function modules are transformed again. Warm them on boot.
 */
export function warmupServerFnsPlugin(): Plugin {
  return {
    name: 'bingo-facil:warmup-server-fns',
    apply: 'serve',
    configureServer(server) {
      const warmup = async () => {
        const ssr = server.environments.ssr;
        if (!ssr) {
          server.config.logger.warn('[warmup-server-fns] SSR environment not found');
          return;
        }

        for (const file of SERVER_FN_FILES) {
          const id = `${server.config.root}/${file}`;
          try {
            await ssr.transformRequest(`${id}?server-fn-module-lookup`);
            await ssr.transformRequest(`${id}?tss-serverfn-split`);
          } catch (error) {
            server.config.logger.warn(`[warmup-server-fns] Failed for ${file}: ${error}`);
          }
        }
      };

      server.httpServer?.once('listening', () => {
        void warmup();
      });
    },
  };
}
