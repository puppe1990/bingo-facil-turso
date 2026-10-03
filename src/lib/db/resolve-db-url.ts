import fs from 'node:fs';
import path from 'node:path';

export interface DatabaseConfig {
  url: string;
  authToken?: string;
}

export function isRemoteLibsqlUrl(url: string): boolean {
  return url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://');
}

export function isServerlessRuntime(): boolean {
  return process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export function usesNativeSqliteDriver(url: string): boolean {
  return !isRemoteLibsqlUrl(url) && !isServerlessRuntime();
}

function isLocalDatabaseUrl(url: string): boolean {
  return url.startsWith('file:') || url === ':memory:' || !url.includes('://');
}

export function normalizeLocalDatabaseUrl(url: string): string {
  if (url === ':memory:' || url.startsWith('file::memory:')) {
    return url.startsWith('file:') ? url : 'file::memory:';
  }

  const rawPath = url.startsWith('file:') ? url.slice('file:'.length) : url;
  const absolutePath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

  if (!isServerlessRuntime()) {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  }

  return `file:${absolutePath}`;
}

function defaultLocalDbPath(): string {
  return path.resolve(process.cwd(), 'data/bingo-facil.sqlite');
}

export function resolveDatabaseConfig(): DatabaseConfig {
  if (isServerlessRuntime()) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url || !process.env.TURSO_AUTH_TOKEN) {
      throw new Error('Turso is required on Netlify. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
    }
    return { url, authToken: process.env.TURSO_AUTH_TOKEN };
  }

  const databasePath = process.env.DATABASE_PATH?.trim();
  if (databasePath) {
    const url =
      databasePath.startsWith('file:') || databasePath === ':memory:'
        ? databasePath
        : `file:${databasePath}`;
    return { url: normalizeLocalDatabaseUrl(url) };
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl && isLocalDatabaseUrl(databaseUrl)) {
    const url = databaseUrl.startsWith('file:') ? databaseUrl : `file:${databaseUrl}`;
    return { url: normalizeLocalDatabaseUrl(url) };
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl && isRemoteLibsqlUrl(tursoUrl)) {
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error('TURSO_AUTH_TOKEN is required when using a remote Turso URL.');
    }
    return { url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN };
  }

  if (tursoUrl) {
    return { url: normalizeLocalDatabaseUrl(tursoUrl) };
  }

  return { url: normalizeLocalDatabaseUrl(`file:${defaultLocalDbPath()}`) };
}
