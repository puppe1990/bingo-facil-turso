import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '@/src/pages/Settings';
import { useSession } from '@/src/lib/auth-client';
import { getUserSubscriptionFn } from '@/src/server/subscriptions.functions';

vi.mock('@/src/lib/auth-client', () => ({
  useSession: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock('@/src/server/subscriptions.functions', () => ({
  getUserSubscriptionFn: vi.fn(),
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

  it('shows real plan badge instead of hardcoded Pro Platinium', async () => {
    vi.mocked(getUserSubscriptionFn).mockResolvedValue({
      plan: 'platinum',
      status: 'active',
      effectiveStatus: 'active',
      expiresAt: new Date('2026-12-31'),
    });

    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Conta Platinum')).toBeInTheDocument();
    });
    expect(screen.queryByText(/conta pro platinium/i)).not.toBeInTheDocument();
  });

  it('shows subscription details on assinatura tab', async () => {
    vi.mocked(getUserSubscriptionFn).mockResolvedValue({
      plan: 'pro',
      status: 'active',
      effectiveStatus: 'active',
      expiresAt: new Date('2026-08-15'),
    });

    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /assinatura/i }));

    expect(await screen.findByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByText(/14\/08\/2026/)).toBeInTheDocument();
  });
});
