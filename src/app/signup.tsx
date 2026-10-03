import { createFileRoute, redirect } from '@tanstack/react-router';
import { SignupPage } from '@/src/features/auth/signup-page';
import { getSessionFn } from '@/src/server/auth.functions';

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: SignupPage,
});
