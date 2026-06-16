import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Layout } from '@/src/components/Layout';
import { useSession } from '@/src/lib/auth-client';
import { getUserAccessForSessionFn } from '@/src/server/user-access.functions';

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

vi.mock('@/src/server/user-access.functions', () => ({
  getUserAccessForSessionFn: vi.fn(),
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

  it('shows access status in sidebar when access is active', async () => {
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: new Date('2026-12-31'),
      effectiveStatus: 'active',
      canAccess: true,
    });

    render(<Layout />);

    await waitFor(() => {
      expect(screen.getByText('Acesso ativo')).toBeInTheDocument();
    });
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  it('shows aguardando ativação in sidebar when access is inactive', async () => {
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: false,
      accessExpiresAt: null,
      effectiveStatus: 'inactive',
      canAccess: false,
    });

    render(<Layout />);

    await waitFor(() => {
      expect(screen.getByText('Aguardando ativação')).toBeInTheDocument();
    });
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
  });

  it('shows acesso expirado in sidebar when access is expired', async () => {
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: new Date('2025-01-01'),
      effectiveStatus: 'expired',
      canAccess: false,
    });

    render(<Layout />);

    await waitFor(() => {
      expect(screen.getByText('Acesso expirado')).toBeInTheDocument();
    });
  });
});
