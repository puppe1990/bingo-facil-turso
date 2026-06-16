import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Client } from '@libsql/client';
import { createTestDb, destroyTestDb } from '../test/db';
import type { AppDatabase } from '../lib/db/index';
import { cards, events, user } from '../lib/db/schema';
import {
  createEventWithCards,
  listEvents,
  sellCard,
  deleteEvent,
  listCards,
  listSoldCards,
  drawNumber,
  resetDraw,
  getEvent,
  DrawLimitError,
  NotFoundError,
} from './events.server';

describe('events.server', () => {
  let db: AppDatabase;
  let client: Client;
  let dbPath: string;
  const userA = 'user-a';
  const userB = 'user-b';

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
    client = testDb.client;
    dbPath = testDb.dbPath;

    const now = new Date();
    await db.insert(user).values([
      {
        id: userA,
        name: 'User A',
        email: 'a@test.com',
        emailVerified: true,
        role: 'user',
        isActive: true,
        accessExpiresAt: new Date('2027-01-01'),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: userB,
        name: 'User B',
        email: 'b@test.com',
        emailVerified: true,
        role: 'user',
        isActive: true,
        accessExpiresAt: new Date('2027-01-01'),
        createdAt: now,
        updatedAt: now,
      },
    ]);
  });

  afterEach(() => {
    destroyTestDb(client, dbPath);
  });

  it('createEventWithCards inserts event and N cards', async () => {
    const eventId = await createEventWithCards(db, userA, {
      name: 'Bingo Beneficente',
      eventDate: '2026-06-10',
      totalCards: 5,
      footerText: 'Boa sorte!',
    });

    const allEvents = await listEvents(db, userA);
    expect(allEvents).toHaveLength(1);
    expect(allEvents[0].id).toBe(eventId);
    expect(allEvents[0].totalCards).toBe(5);

    const eventCards = await listCards(db, eventId, userA);
    expect(eventCards).toHaveLength(5);
    expect(eventCards[0].cardNumber).toBe('000001');
  });

  it('listEvents returns only events for user', async () => {
    await createEventWithCards(db, userA, {
      name: 'Event A',
      eventDate: '2026-06-10',
      totalCards: 2,
    });
    await createEventWithCards(db, userB, {
      name: 'Event B',
      eventDate: '2026-06-11',
      totalCards: 2,
    });

    const userEvents = await listEvents(db, userA);
    expect(userEvents).toHaveLength(1);
    expect(userEvents[0].name).toBe('Event A');
  });

  it('sellCard updates status and buyer info', async () => {
    const eventId = await createEventWithCards(db, userA, {
      name: 'Vendas',
      eventDate: '2026-06-10',
      totalCards: 1,
    });
    const allCards = await listCards(db, eventId, userA);
    const [card] = allCards;

    await sellCard(db, eventId, card.id, userA, 'Maria', '11999999999');

    const updated = (await listCards(db, eventId, userA)).find((c) => c.id === card.id);
    expect(updated?.status).toBe('sold');
    expect(updated?.buyerName).toBe('Maria');
    expect(updated?.buyerPhone).toBe('11999999999');
  });

  it('deleteEvent cascades cards', async () => {
    const eventId = await createEventWithCards(db, userA, {
      name: 'Delete Me',
      eventDate: '2026-06-10',
      totalCards: 3,
    });

    await deleteEvent(db, eventId, userA);

    const remainingEvents = await listEvents(db, userA);
    expect(remainingEvents).toHaveLength(0);

    const remainingCards = await db.select().from(cards).where(eq(cards.eventId, eventId));
    expect(remainingCards).toHaveLength(0);
  });

  it('listSoldCards returns sold cards across events', async () => {
    const eventId1 = await createEventWithCards(db, userA, {
      name: 'Event 1',
      eventDate: '2026-06-10',
      totalCards: 1,
    });
    const eventId2 = await createEventWithCards(db, userA, {
      name: 'Event 2',
      eventDate: '2026-06-11',
      totalCards: 1,
    });

    const [card1] = await listCards(db, eventId1, userA);
    const [card2] = await listCards(db, eventId2, userA);

    await sellCard(db, eventId1, card1.id, userA, 'João');
    await sellCard(db, eventId2, card2.id, userA, 'Ana');

    const sold = await listSoldCards(db, userA);
    expect(sold).toHaveLength(2);
    expect(sold.map((s) => s.buyerName).sort()).toEqual(['Ana', 'João']);
  });

  it('drawNumber appends unique number to drawnNumbers', async () => {
    const eventId = await createEventWithCards(db, userA, {
      name: 'Sorteio',
      eventDate: '2026-06-10',
      totalCards: 1,
    });

    const drawn = await drawNumber(db, eventId, userA);
    expect(drawn).toHaveLength(1);
    expect(drawn[0]).toBeGreaterThanOrEqual(1);
    expect(drawn[0]).toBeLessThanOrEqual(75);

    const drawn2 = await drawNumber(db, eventId, userA);
    expect(drawn2).toHaveLength(2);
    expect(new Set(drawn2).size).toBe(2);
  });

  it('drawNumber rejects when 75 numbers drawn', async () => {
    const eventId = await createEventWithCards(db, userA, {
      name: 'Full Draw',
      eventDate: '2026-06-10',
      totalCards: 1,
    });

    const allNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    await db.update(events).set({ drawnNumbers: allNumbers }).where(eq(events.id, eventId));

    await expect(drawNumber(db, eventId, userA)).rejects.toBeInstanceOf(DrawLimitError);
  });

  it('getEvent rejects access from other user', async () => {
    const eventId = await createEventWithCards(db, userA, {
      name: 'Private',
      eventDate: '2026-06-10',
      totalCards: 1,
    });

    await expect(getEvent(db, eventId, userB)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('resetDraw clears drawn numbers', async () => {
    const eventId = await createEventWithCards(db, userA, {
      name: 'Reset',
      eventDate: '2026-06-10',
      totalCards: 1,
    });

    await drawNumber(db, eventId, userA);
    const cleared = await resetDraw(db, eventId, userA);
    expect(cleared).toEqual([]);
  });
});
