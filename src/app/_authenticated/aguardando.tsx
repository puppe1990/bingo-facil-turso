import { createFileRoute } from '@tanstack/react-router';
import { InactiveAccount } from '@/src/pages/InactiveAccount';

export const Route = createFileRoute('/_authenticated/aguardando')({
  component: InactiveAccount,
});
