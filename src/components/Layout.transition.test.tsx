import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Layout } from '@/src/components/Layout';
import { useSession } from '@/src/lib/auth-client';
import { getUserAccessForSessionFn } from '@/src/server/user-access.functions';

let pathname = '/';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ children, ...props }: { children: ReactNode; to: string }) => (
      <a href={props.to}>{children}</a>
    ),
    Outlet: () => null,
    useNavigate: () => vi.fn(),
    useRouterState: (opts?: {
      select?: (state: { location: { pathname: string } }) => unknown;
    }) => {
      const state = { location: { pathname } };
      return opts?.select ? opts.select(state) : state;
    },
  };
});

vi.mock('@/src/lib/auth-client', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/src/server/user-access.functions', () => ({
  getUserAccessForSessionFn: vi.fn(),
}));

describe('Layout route transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = '/';
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: 'Maria', email: 'maria@test.com' },
        session: { id: 's1' },
      },
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: () => {},
    } as ReturnType<typeof useSession>);
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: null,
      effectiveStatus: 'active',
      canAccess: true,
    });
  });

  it('replaces route content immediately instead of stacking an exit animation', () => {
    const { rerender } = render(
      <Layout>
        <h1>Início</h1>
      </Layout>,
    );

    expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument();

    pathname = '/create';
    rerender(
      <Layout>
        <h1>Novo Bingo</h1>
      </Layout>,
    );

    expect(screen.queryByRole('heading', { name: 'Início' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Novo Bingo' })).toBeInTheDocument();
  });
});
