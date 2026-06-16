import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, destroyTestDb } from '../test/db';
import type { AppDatabase } from '../lib/db/index';
import { user, subscriptions } from '../lib/db/schema';
import { getUserSubscription, resolveSubscriptionStatus } from './subscriptions.server';

describe('subscriptions.server (main app)', () => {
  let db: AppDatabase;
  let client: Awaited<ReturnType<typeof createTestDb>>['client'];
  let dbPath: string;

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
    client = testDb.client;
    dbPath = testDb.dbPath;

    const now = new Date();
    await db.insert(user).values({
      id: 'u1',
      name: 'Maria',
      email: 'maria@test.com',
      emailVerified: true,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(subscriptions).values({
      id: 'sub1',
      userId: 'u1',
      plan: 'platinum',
      status: 'active',
      expiresAt: new Date('2026-12-31'),
      createdAt: now,
    });
  });

  afterEach(() => {
    destroyTestDb(client, dbPath);
  });

  it('resolveSubscriptionStatus marks past active subscriptions as expired', () => {
    expect(
      resolveSubscriptionStatus('active', new Date('2026-01-01'), new Date('2026-06-14')),
    ).toBe('expired');
  });

  it('getUserSubscription returns plan and expiresAt for user', async () => {
    const sub = await getUserSubscription(db, 'u1', new Date('2026-06-14'));
    expect(sub?.plan).toBe('platinum');
    expect(sub?.effectiveStatus).toBe('active');
    expect(sub?.expiresAt.toISOString()).toContain('2026-12-31');
  });

  it('getUserSubscription returns null when user has no subscription', async () => {
    const sub = await getUserSubscription(db, 'missing-user');
    expect(sub).toBeNull();
  });
});
