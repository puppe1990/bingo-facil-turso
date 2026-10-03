import type { Client } from '@libsql/client/web';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { migrateClient } from './migrate';
import { resolveDatabaseConfig, usesNativeSqliteDriver } from './resolve-db-url';

export type AppDatabase = LibSQLDatabase<typeof schema>;

let client: Client | null = null;
let dbInstance: AppDatabase | null = null;

async function createConnection(url: string, authToken?: string) {
  if (usesNativeSqliteDriver(url)) {
    const { createLocalLibsqlClient } = await import('./local-client');
    return createLocalLibsqlClient(url, authToken);
  }

  const { createClient } = await import('@libsql/client/web');
  const { drizzle } = await import('drizzle-orm/libsql/web');
  const libsql = createClient({ url, authToken: authToken || undefined });
  return { client: libsql, db: drizzle(libsql, { schema }) };
}

export async function createDbConnection(url: string, authToken?: string): Promise<AppDatabase> {
  const connection = await createConnection(url, authToken);
  return connection.db;
}

let initPromise: Promise<AppDatabase> | null = null;

export async function getDbReady(): Promise<AppDatabase> {
  if (!dbInstance) {
    if (!initPromise) {
      initPromise = (async () => {
        const { url, authToken } = resolveDatabaseConfig();
        const connection = await createConnection(url, authToken);
        client = connection.client;
        await migrateClient(client);
        dbInstance = connection.db;
        return dbInstance;
      })();
    }
    await initPromise;
  }
  return dbInstance!;
}

export function getDb(): AppDatabase {
  if (!dbInstance) {
    throw new Error('Database not ready. Call getDbReady() first.');
  }
  return dbInstance;
}

export async function migrateDb(database: AppDatabase, libsqlClient?: Client): Promise<void> {
  const libsql = libsqlClient ?? client;
  if (!libsql) {
    throw new Error('No libsql client available for migration');
  }
  await migrateClient(libsql);
}

export function closeDb(): void {
  if (client && !client.closed) {
    client.close();
  }
  client = null;
  dbInstance = null;
  initPromise = null;
}

export function resetDbForTests(): void {
  closeDb();
}

export { migrateClient } from './migrate';
