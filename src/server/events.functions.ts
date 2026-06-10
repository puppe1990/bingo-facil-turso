import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { getAuth } from '../lib/auth.server';
import { getDb, getDbReady } from '../lib/db/index';
import * as eventsServer from './events.server';

async function requireUserId() {
  await getDbReady();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export const listEventsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUserId();
  return eventsServer.listEvents(getDb(), userId);
});

export const getEventFn = createServerFn({ method: 'GET' })
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return eventsServer.getEvent(getDb(), data.eventId, userId);
  });

const createEventSchema = z.object({
  name: z.string().min(1),
  eventDate: z.string(),
  totalCards: z.number().min(1).max(10000),
  bingoType: z.string().optional(),
  footerText: z.string().optional(),
});

export const createEventFn = createServerFn({ method: 'POST' })
  .validator(createEventSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return eventsServer.createEventWithCards(getDb(), userId, data);
  });

export const deleteEventFn = createServerFn({ method: 'POST' })
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    await eventsServer.deleteEvent(getDb(), data.eventId, userId);
    return { success: true };
  });

export const listCardsFn = createServerFn({ method: 'GET' })
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return eventsServer.listCards(getDb(), data.eventId, userId);
  });

export const sellCardFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      eventId: z.string(),
      cardId: z.string(),
      buyerName: z.string().min(1),
      buyerPhone: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    await eventsServer.sellCard(
      getDb(),
      data.eventId,
      data.cardId,
      userId,
      data.buyerName,
      data.buyerPhone,
    );
    return { success: true };
  });

export const listSoldCardsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUserId();
  return eventsServer.listSoldCards(getDb(), userId);
});

export const drawNumberFn = createServerFn({ method: 'POST' })
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return eventsServer.drawNumber(getDb(), data.eventId, userId);
  });

export const resetDrawFn = createServerFn({ method: 'POST' })
  .validator(z.object({ eventId: z.string() }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    return eventsServer.resetDraw(getDb(), data.eventId, userId);
  });