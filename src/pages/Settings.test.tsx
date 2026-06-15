import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '@/src/pages/Settings';
import { useSession } from '@/src/lib/auth-client';

const changePasswordMock = vi.fn();

vi.mock('@/src/lib/auth-client', () => ({
  useSession: vi.fn(),
  changePassword: (...args: unknown[]) => changePasswordMock(...args),
}));

describe('Settings change password', () => {
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

  it('shows change password form on Segurança tab', async () => {
    const user = userEvent.setup();
    render(<Settings />);

    await user.click(screen.getByRole('button', { name: /segurança/i }));

    expect(screen.getByLabelText(/senha atual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^nova senha$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar nova senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /trocar senha/i })).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: /segurança/i }));

    await user.type(screen.getByLabelText(/senha atual/i), 'oldpassword123');
    await user.type(screen.getByLabelText(/^nova senha$/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'different123');
    await user.click(screen.getByRole('button', { name: /trocar senha/i }));

    expect(await screen.findByText(/as senhas não coincidem/i)).toBeInTheDocument();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('calls changePassword and shows success message', async () => {
    changePasswordMock.mockResolvedValue({ data: { status: true }, error: null });
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: /segurança/i }));

    await user.type(screen.getByLabelText(/senha atual/i), 'oldpassword123');
    await user.type(screen.getByLabelText(/^nova senha$/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /trocar senha/i }));

    await waitFor(() => {
      expect(changePasswordMock).toHaveBeenCalledWith({
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword123',
        revokeOtherSessions: true,
      });
    });
    expect(await screen.findByText(/senha alterada com sucesso/i)).toBeInTheDocument();
  });

  it('shows error when changePassword fails', async () => {
    changePasswordMock.mockResolvedValue({
      data: null,
      error: { message: 'Invalid password' },
    });
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole('button', { name: /segurança/i }));

    await user.type(screen.getByLabelText(/senha atual/i), 'wrongpassword');
    await user.type(screen.getByLabelText(/^nova senha$/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirmar nova senha/i), 'newpassword123');
    await user.click(screen.getByRole('button', { name: /trocar senha/i }));

    expect(await screen.findByText(/senha atual incorreta/i)).toBeInTheDocument();
  });
});
