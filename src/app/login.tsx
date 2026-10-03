import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginPage } from '@/src/features/auth/login-page';
import { getSessionFn } from '@/src/server/auth.functions';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});
