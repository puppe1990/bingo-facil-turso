import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Client } from '@libsql/client';
import { resetAuthForTests } from '../lib/auth.server';
import { getDb, getDbReady, resetDbForTests } from '../lib/db/index';
import { user } from '../lib/db/schema';
import { getAuth } from '../lib/auth.server';
import {
  createEventWithCards,
  drawNumber,
  getEvent,
  listCards,
  listSoldCards,
  sellCard,
} from '../server/events.server';
import { createTestDb, destroyTestDb } from './db';

describe('e2e flow: signup → event → sell → draw', () => {
  let client: Client;
  let dbPath: string;

  beforeEach(async () => {
    const testDb = await createTestDb();
    client = testDb.client;
    dbPath = testDb.dbPath;
    process.env.TURSO_DATABASE_URL = `file:${dbPath}`;
    resetDbForTests();
    resetAuthForTests();
    await getDbReady();
  });

  afterEach(() => {
    resetAuthForTests();
    resetDbForTests();
    destroyTestDb(client, dbPath);
  });

  it('completes the full bingo organizer journey', async () => {
    const email = `organizer-${crypto.randomUUID()}@bingo.test`;
    const password = 'password123';
    const auth = await getAuth();

    const signup = await auth.api.signUpEmail({
      body: {
        name: 'Organizador Teste',
        email,
        password,
      },
    });

    expect(signup.user.email).toBe(email);

    const [dbUser] = await getDb().select().from(user).where(eq(user.email, email)).limit(1);
    expect(dbUser).toBeTruthy();

    const userId = dbUser!.id;
    const db = getDb();

    const eventId = await createEventWithCards(db, userId, {
      name: 'Bingo Beneficente E2E',
      eventDate: '2026-06-10',
      totalCards: 3,
      footerText: 'Boa sorte!',
    });

    const event = await getEvent(db, eventId, userId);
    expect(event.name).toBe('Bingo Beneficente E2E');
    expect(event.totalCards).toBe(3);

    const eventCards = await listCards(db, eventId, userId);
    expect(eventCards).toHaveLength(3);

    const [card] = eventCards;
    await sellCard(db, eventId, card.id, userId, 'Maria Silva', '11999999999');

    const soldCards = await listSoldCards(db, userId);
    expect(soldCards).toHaveLength(1);
    expect(soldCards[0].buyerName).toBe('Maria Silva');
    expect(soldCards[0].eventName).toBe('Bingo Beneficente E2E');

    const drawn = await drawNumber(db, eventId, userId);
    expect(drawn).toHaveLength(1);
    expect(drawn[0]).toBeGreaterThanOrEqual(1);
    expect(drawn[0]).toBeLessThanOrEqual(75);

    const updatedEvent = await getEvent(db, eventId, userId);
    expect(updatedEvent.drawnNumbers).toEqual(drawn);
  });
});