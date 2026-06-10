import { createFileRoute } from '@tanstack/react-router';
import { CreateEvent } from '@/src/pages/CreateEvent';

export const Route = createFileRoute('/_authenticated/create')({
  component: CreateEvent,
});
