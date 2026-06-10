import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

export type AppDatabase = LibSQLDatabase<typeof schema>;

let client: Client | null = null;
let dbInstance: AppDatabase | null = null;

export function createDbConnection(url: string, authToken?: string): AppDatabase {
  const libsql = createClient({
    url,
    authToken: authToken || undefined,
  });
  return drizzle(libsql, { schema });
}

let initPromise: Promise<AppDatabase> | null = null;

export async function getDbReady(): Promise<AppDatabase> {
  if (!dbInstance) {
    if (!initPromise) {
      initPromise = (async () => {
        const url = process.env.TURSO_DATABASE_URL ?? 'file:./data/bingo-facil.sqlite';
        const authToken = process.env.TURSO_AUTH_TOKEN;
        client = createClient({ url, authToken: authToken || undefined });
        await migrateClient(client);
        dbInstance = drizzle(client, { schema });
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

const MIGRATION_STATEMENTS = [
    `CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      bingo_type TEXT NOT NULL DEFAULT '75',
      total_cards INTEGER NOT NULL,
      footer_text TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      drawn_numbers TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      card_number TEXT NOT NULL,
      numbers TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      buyer_name TEXT,
      buyer_phone TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER
    )`,
    `CREATE INDEX IF NOT EXISTS idx_events_user_created ON events(user_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_cards_event_number ON cards(event_id, card_number)`,
    `CREATE INDEX IF NOT EXISTS idx_cards_user_status ON cards(user_id, status, updated_at)`,
];

export async function migrateClient(libsql: Client): Promise<void> {
  for (const sql of MIGRATION_STATEMENTS) {
    await libsql.execute(sql);
  }
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