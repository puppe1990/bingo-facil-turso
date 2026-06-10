import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '@/src/pages/Dashboard';

export const Route = createFileRoute('/_authenticated/')({
  component: Dashboard,
});
