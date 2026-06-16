import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '@/src/pages/Settings';
import { useSession } from '@/src/lib/auth-client';
import { getUserAccessForSessionFn } from '@/src/server/user-access.functions';

vi.mock('@/src/lib/auth-client', () => ({
  useSession: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('@/src/server/user-access.functions', () => ({
  getUserAccessForSessionFn: vi.fn(),
}));

describe('Settings access display', () => {
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

  it('shows access status badge on profile', async () => {
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
    expect(screen.queryByText(/assinatura/i)).not.toBeInTheDocument();
  });

  it('shows access details on acesso tab', async () => {
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: new Date(2026, 11, 31),
      effectiveStatus: 'active',
      canAccess: true,
    });

    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /acesso/i }));

    expect(await screen.findByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('31/12/2026')).toBeInTheDocument();
    expect(screen.queryByText(/sua assinatura/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/assinatura ativa/i)).not.toBeInTheDocument();
  });

  it('shows inactive access status and waiting message on acesso tab', async () => {
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: false,
      accessExpiresAt: null,
      effectiveStatus: 'inactive',
      canAccess: false,
    });

    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /acesso/i }));

    expect(await screen.findByText('Inativo')).toBeInTheDocument();
    expect(screen.getByText('Aguardando ativação pelo admin')).toBeInTheDocument();
  });

  it('shows expired access status with expiry date on acesso tab', async () => {
    vi.mocked(getUserAccessForSessionFn).mockResolvedValue({
      isActive: true,
      accessExpiresAt: new Date(2026, 0, 10),
      effectiveStatus: 'expired',
      canAccess: false,
    });

    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /acesso/i }));

    expect(await screen.findByText('Expirado')).toBeInTheDocument();
    expect(screen.getByText('10/01/2026')).toBeInTheDocument();
  });
});
