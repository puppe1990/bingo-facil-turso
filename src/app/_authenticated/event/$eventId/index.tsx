import { createFileRoute } from '@tanstack/react-router';
import { EventManage } from '@/src/pages/EventManage';

export const Route = createFileRoute('/_authenticated/event/$eventId/')({
  component: EventManage,
});
