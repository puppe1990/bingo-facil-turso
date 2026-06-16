import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '@/src/pages/Settings';
import { useSession } from '@/src/lib/auth-client';
import { getUserSubscriptionFn } from '@/src/server/subscriptions.functions';
import { getUserAccessForSessionFn } from '@/src/server/user-access.functions';

vi.mock('@/src/lib/auth-client', () => ({
  useSession: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('@/src/server/subscriptions.functions', () => ({
  getUserSubscriptionFn: vi.fn(),
}));

vi.mock('@/src/server/user-access.functions', () => ({
  getUserAccessForSessionFn: vi.fn(),
}));

describe('Settings subscription display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: '1', name: 'Maria', email: 'maria@bingo.test' },
        session: { id: 's1' },
      },
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: () => {},
    } as ReturnType<typeof useSession>);
  });

  it('shows access status badge on profile instead of plan type', async () => {
    vi.mocked(getUserSubscriptionFn).mockResolvedValue({
      plan: 'platinum',
      status: 'active',
      effectiveStatus: 'active',
      expiresAt: new Date('2026-12-31'),
    });
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: new Date('2026-12-31'),
      effectiveStatus: 'active',
      canAccess: true,
    });

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Ativo')).toBeInTheDocument();
    });
    expect(screen.queryByText(/conta platinum/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conta pro/i)).not.toBeInTheDocument();
  });

  it('shows subscription details on assinatura tab', async () => {
    vi.mocked(getUserSubscriptionFn).mockResolvedValue({
      plan: 'pro',
      status: 'active',
      effectiveStatus: 'active',
      expiresAt: new Date(2026, 7, 15),
    });
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: new Date(2026, 11, 31),
      effectiveStatus: 'active',
      canAccess: true,
    });

    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /assinatura/i }));

    expect(await screen.findByText('Ativa')).toBeInTheDocument();
    expect(screen.queryByText('Pro')).not.toBeInTheDocument();
    expect(screen.queryByText('Plano')).not.toBeInTheDocument();
    expect(screen.getByText('15/08/2026')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('31/12/2026')).toBeInTheDocument();
  });

  it('shows inactive access status and waiting message on assinatura tab', async () => {
    vi.mocked(getUserSubscriptionFn).mockResolvedValue(null);
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: false,
      accessExpiresAt: null,
      effectiveStatus: 'inactive',
      canAccess: false,
    });

    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /assinatura/i }));

    expect(await screen.findByText('Inativo')).toBeInTheDocument();
    expect(screen.getByText('Aguardando ativação pelo admin')).toBeInTheDocument();
  });

  it('shows expired access status with expiry date on assinatura tab', async () => {
    vi.mocked(getUserSubscriptionFn).mockResolvedValue(null);
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: new Date(2026, 0, 10),
      effectiveStatus: 'expired',
      canAccess: false,
    });

    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /assinatura/i }));

    expect(await screen.findByText('Expirado')).toBeInTheDocument();
    expect(screen.getByText('10/01/2026')).toBeInTheDocument();
  });
});
