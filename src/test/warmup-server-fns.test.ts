import { describe, expect, it } from 'vitest';
import { warmupServerFnsPlugin } from '../../scripts/warmup-server-fns-plugin';

describe('warmupServerFnsPlugin', () => {
  it('registers a dev-only vite plugin', () => {
    const plugin = warmupServerFnsPlugin();
    expect(plugin.name).toBe('bingo-facil:warmup-server-fns');
    expect(plugin.apply).toBe('serve');
    expect(typeof plugin.configureServer).toBe('function');
  });
});