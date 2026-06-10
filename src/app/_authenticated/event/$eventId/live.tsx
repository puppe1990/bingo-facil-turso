import { createFileRoute } from '@tanstack/react-router';
import { LiveDraw } from '@/src/pages/LiveDraw';
import { getEventFn, listCardsFn } from '@/src/server/events.functions';

export const Route = createFileRoute('/_authenticated/event/$eventId/live')({
  loader: async ({ params }) => {
    const { eventId } = params;
    const [event, allCards] = await Promise.all([
      getEventFn({ data: { eventId } }),
      listCardsFn({ data: { eventId } }),
    ]);

    return {
      event,
      cards: allCards.filter((card) => card.status === 'sold'),
    };
  },
  component: LiveDraw,
});
