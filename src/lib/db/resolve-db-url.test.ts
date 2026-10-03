import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  normalizeLocalDatabaseUrl,
  resolveDatabaseConfig,
  usesNativeSqliteDriver,
} from './resolve-db-url';

describe('normalizeLocalDatabaseUrl', () => {
  it('resolves relative file URLs to an absolute path', () => {
    const normalized = normalizeLocalDatabaseUrl('file:./data/bingo-facil.sqlite');
    expect(normalized).toBe(`file:${join(process.cwd(), 'data/bingo-facil.sqlite')}`);
  });

  it('preserves in-memory URLs', () => {
    expect(normalizeLocalDatabaseUrl('file::memory:')).toBe('file::memory:');
  });
});

describe('usesNativeSqliteDriver', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NETLIFY;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses the native driver for a local file in production on a VM', () => {
    process.env.NODE_ENV = 'production';
    expect(usesNativeSqliteDriver('file:/opt/bingo-facil/data/bingo-facil.sqlite')).toBe(true);
  });

  it('uses the web driver for remote Turso URLs', () => {
    expect(usesNativeSqliteDriver('libsql://example.turso.io')).toBe(false);
  });

  it('uses the web driver on Netlify', () => {
    process.env.NETLIFY = 'true';
    expect(usesNativeSqliteDriver('file:./data/bingo-facil.sqlite')).toBe(false);
  });
});

describe('resolveDatabaseConfig', () => {
  const originalEnv = process.env;
  const tmpDir = join(tmpdir(), `bingo-resolve-${crypto.randomUUID()}`);

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NETLIFY;
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.DATABASE_PATH;
    delete process.env.DATABASE_URL;
    delete process.env.TURSO_DATABASE_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('prefers DATABASE_PATH over Turso so Cleat can pin the sqlite file', () => {
    process.env.TURSO_DATABASE_URL = 'libsql://example.turso.io';
    process.env.TURSO_AUTH_TOKEN = 'secret-token';
    process.env.DATABASE_PATH = join(tmpDir, 'bingo-facil.sqlite');

    const config = resolveDatabaseConfig();
    expect(config.url).toBe(`file:${join(tmpDir, 'bingo-facil.sqlite')}`);
    expect(config.authToken).toBeUndefined();
  });

  it('uses a file TURSO_DATABASE_URL on a VM', () => {
    process.env.TURSO_DATABASE_URL = `file:${join(tmpDir, 'local.sqlite')}`;

    const config = resolveDatabaseConfig();
    expect(config.url).toBe(`file:${join(tmpDir, 'local.sqlite')}`);
  });

  it('requires Turso credentials on Netlify', () => {
    process.env.NETLIFY = 'true';
    expect(() => resolveDatabaseConfig()).toThrow(/Turso is required on Netlify/);
  });
});
