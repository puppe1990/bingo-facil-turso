import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, destroyTestDb } from '../test/db';
import type { AppDatabase } from '../lib/db/index';
import { user } from '../lib/db/schema';
import { assertUserCanAccess, UserAccessDeniedError } from './user-access.server';

describe('user-access.server', () => {
  let db: AppDatabase;
  let client: Awaited<ReturnType<typeof createTestDb>>['client'];
  let dbPath: string;
  const now = new Date('2026-06-15');

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
    client = testDb.client;
    dbPath = testDb.dbPath;
  });

  afterEach(() => {
    destroyTestDb(client, dbPath);
  });

  it('throws when user is inactive', async () => {
    await db.insert(user).values({
      id: 'u1',
      name: 'Inativo',
      email: 'inativo@test.com',
      emailVerified: true,
      role: 'user',
      isActive: false,
      accessExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await expect(assertUserCanAccess(db, 'u1', now)).rejects.toBeInstanceOf(UserAccessDeniedError);
  });

  it('succeeds when user is active with future access date', async () => {
    await db.insert(user).values({
      id: 'u2',
      name: 'Ativo',
      email: 'ativo@test.com',
      emailVerified: true,
      role: 'user',
      isActive: true,
      accessExpiresAt: new Date('2026-12-31'),
      createdAt: now,
      updatedAt: now,
    });

    const access = await assertUserCanAccess(db, 'u2', now);
    expect(access.canAccess).toBe(true);
    expect(access.effectiveStatus).toBe('active');
  });
});
