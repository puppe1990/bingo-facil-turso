import { createFileRoute } from '@tanstack/react-router';
import { LiveDraw } from '@/src/pages/LiveDraw';

export const Route = createFileRoute('/_authenticated/event/$eventId/live')({
  component: LiveDraw,
});