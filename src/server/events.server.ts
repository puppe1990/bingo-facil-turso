import { and, desc, eq } from 'drizzle-orm';
import { generateUniqueCards } from '../lib/bingo';
import type { AppDatabase } from '../lib/db/index';
import { cards, events } from '../lib/db/schema';
import { assertUserCanAccess } from './user-access.server';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DrawLimitError extends Error {
  constructor(message = 'All numbers have been drawn') {
    super(message);
    this.name = 'DrawLimitError';
  }
}

async function getOwnedEvent(db: AppDatabase, eventId: string, userId: string) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.userId, userId)))
    .limit(1);
  if (!event) throw new NotFoundError('Event not found');
  return event;
}

export async function listEvents(db: AppDatabase, userId: string) {
  await assertUserCanAccess(db, userId);
  return db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt));
}

export async function getEvent(db: AppDatabase, eventId: string, userId: string) {
  await assertUserCanAccess(db, userId);
  return getOwnedEvent(db, eventId, userId);
}

export async function createEventWithCards(
  db: AppDatabase,
  userId: string,
  input: {
    name: string;
    eventDate: string;
    totalCards: number;
    bingoType?: string;
    footerText?: string;
  },
) {
  await assertUserCanAccess(db, userId);
  const eventId = crypto.randomUUID();
  const bingoCards = generateUniqueCards(input.totalCards);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(events).values({
      id: eventId,
      userId,
      name: input.name,
      eventDate: input.eventDate,
      bingoType: input.bingoType ?? '75',
      totalCards: input.totalCards,
      footerText: input.footerText ?? '',
      status: 'active',
      drawnNumbers: [],
      createdAt: now,
    });

    const cardRows = bingoCards.map((numbers, index) => ({
      id: crypto.randomUUID(),
      eventId,
      userId,
      cardNumber: String(index + 1).padStart(6, '0'),
      numbers,
      status: 'available' as const,
      createdAt: now,
    }));

    const batchSize = 100;
    for (let i = 0; i < cardRows.length; i += batchSize) {
      await tx.insert(cards).values(cardRows.slice(i, i + batchSize));
    }
  });

  return eventId;
}

export async function deleteEvent(db: AppDatabase, eventId: string, userId: string) {
  await assertUserCanAccess(db, userId);
  await getOwnedEvent(db, eventId, userId);
  await db.delete(events).where(and(eq(events.id, eventId), eq(events.userId, userId)));
}

export async function listCards(db: AppDatabase, eventId: string, userId: string) {
  await assertUserCanAccess(db, userId);
  await getOwnedEvent(db, eventId, userId);
  return db.select().from(cards).where(eq(cards.eventId, eventId)).orderBy(cards.cardNumber);
}

export async function sellCard(
  db: AppDatabase,
  eventId: string,
  cardId: string,
  userId: string,
  buyerName: string,
  buyerPhone?: string,
) {
  await assertUserCanAccess(db, userId);
  await getOwnedEvent(db, eventId, userId);
  const now = new Date();
  await db
    .update(cards)
    .set({
      status: 'sold',
      buyerName,
      buyerPhone: buyerPhone ?? null,
      updatedAt: now,
    })
    .where(and(eq(cards.id, cardId), eq(cards.eventId, eventId), eq(cards.userId, userId)));
}

export async function listSoldCards(db: AppDatabase, userId: string) {
  await assertUserCanAccess(db, userId);
  const sold = await db
    .select()
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.status, 'sold')))
    .orderBy(desc(cards.updatedAt));

  const eventIds = [...new Set(sold.map((c) => c.eventId))];
  const eventMap = new Map<string, string>();

  for (const eventId of eventIds) {
    const id = String(eventId);
    const [event] = await db
      .select({ id: events.id, name: events.name })
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    if (event) eventMap.set(event.id, event.name);
  }

  return sold.map((card) => ({
    ...card,
    eventName: eventMap.get(card.eventId) ?? '',
  }));
}

export async function drawNumber(db: AppDatabase, eventId: string, userId: string) {
  await assertUserCanAccess(db, userId);
  const event = await getOwnedEvent(db, eventId, userId);
  const drawn = event.drawnNumbers ?? [];

  if (drawn.length >= 75) {
    throw new DrawLimitError();
  }

  let next: number;
  do {
    next = Math.floor(Math.random() * 75) + 1;
  } while (drawn.includes(next));

  const newDrawn = [...drawn, next];
  const now = new Date();

  await db
    .update(events)
    .set({ drawnNumbers: newDrawn, updatedAt: now })
    .where(eq(events.id, eventId));

  return newDrawn;
}

export async function resetDraw(db: AppDatabase, eventId: string, userId: string) {
  await assertUserCanAccess(db, userId);
  await getOwnedEvent(db, eventId, userId);
  const now = new Date();
  await db.update(events).set({ drawnNumbers: [], updatedAt: now }).where(eq(events.id, eventId));
  return [];
}
