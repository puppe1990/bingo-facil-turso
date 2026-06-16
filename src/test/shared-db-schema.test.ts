import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, destroyTestDb } from './db';

describe('shared/db schema migrations', () => {
  let dbPath: string;
  let client: Awaited<ReturnType<typeof createTestDb>>['client'];

  beforeEach(async () => {
    const testDb = await createTestDb();
    client = testDb.client;
    dbPath = testDb.dbPath;
  });

  afterEach(() => {
    destroyTestDb(client, dbPath);
  });

  it('creates user table with role column defaulting to user', async () => {
    const result = await client.execute('PRAGMA table_info(user)');
    const columns = result.rows.map((row) => row.name as string);

    expect(columns).toContain('role');

    const insert = await client.execute({
      sql: `INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['u1', 'Test User', 'test@example.com', 0, Date.now(), Date.now()],
    });
    expect(insert.rowsAffected).toBe(1);

    const row = await client.execute('SELECT role FROM user WHERE id = ?', ['u1']);
    expect(row.rows[0]?.role).toBe('user');
  });

  it('creates subscriptions table with expires_at and user_id', async () => {
    const result = await client.execute('PRAGMA table_info(subscriptions)');
    const columns = result.rows.map((row) => row.name as string);

    expect(columns).toEqual(
      expect.arrayContaining([
        'id',
        'user_id',
        'plan',
        'status',
        'expires_at',
        'notes',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('allows inserting a subscription linked to a user', async () => {
    const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

    await client.execute({
      sql: `INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['u1', 'Maria', 'maria@test.com', 1, 'user', now, now],
    });

    await client.execute({
      sql: `INSERT INTO subscriptions (id, user_id, plan, status, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ['sub1', 'u1', 'pro', 'active', expiresAt, now],
    });

    const row = await client.execute(
      'SELECT plan, status, expires_at FROM subscriptions WHERE id = ?',
      ['sub1'],
    );
    expect(row.rows[0]?.plan).toBe('pro');
    expect(row.rows[0]?.status).toBe('active');
    expect(row.rows[0]?.expires_at).toBe(expiresAt);
  });
});
