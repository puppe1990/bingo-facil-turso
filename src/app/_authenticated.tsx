import { createFileRoute, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import { Layout } from '@/src/components/Layout';
import { getSessionFn } from '@/src/server/auth.functions';
import { assertUserCanAccessFn } from '@/src/server/user-access.functions';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn();
    if (!session) {
      throw redirect({ to: '/login' });
    }

    const isAguardando = location.pathname === '/aguardando';
    if (!isAguardando) {
      const accessCheck = await assertUserCanAccessFn();
      if (!accessCheck.ok) {
        throw redirect({ to: '/aguardando' });
      }
    }

    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAguardando = pathname === '/aguardando';

  if (isAguardando) {
    return <Outlet />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
