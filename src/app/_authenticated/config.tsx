import { createFileRoute } from '@tanstack/react-router';
import { Settings } from '@/src/pages/Settings';

export const Route = createFileRoute('/_authenticated/config')({
  component: Settings,
});
