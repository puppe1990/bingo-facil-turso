import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Layout } from '@/src/components/Layout';
import { getSessionFn } from '@/src/server/auth.functions';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
