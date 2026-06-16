import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Layout } from '@/src/components/Layout';
import { useSession } from '@/src/lib/auth-client';
import { getUserSubscriptionFn } from '@/src/server/subscriptions.functions';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ children, ...props }: { children: ReactNode; to: string }) => (
      <a href={props.to}>{children}</a>
    ),
    Outlet: () => null,
    useNavigate: () => vi.fn(),
    useRouterState: () => ({ location: { pathname: '/' } }),
  };
});

vi.mock('@/src/lib/auth-client', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/src/server/subscriptions.functions', () => ({
  getUserSubscriptionFn: vi.fn(),
}));

describe('Layout subscription label', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it('shows real plan label in sidebar', async () => {
    vi.mocked(getUserSubscriptionFn).mockResolvedValue({
      plan: 'pro',
      status: 'active',
      effectiveStatus: 'active',
      expiresAt: new Date('2026-12-31'),
    });

    render(<Layout />);

    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });
    expect(screen.queryByText(/PRO • Ilimitado/i)).not.toBeInTheDocument();
  });
});
