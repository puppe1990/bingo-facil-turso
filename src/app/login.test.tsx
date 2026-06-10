import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginPage } from '@/src/features/auth/login-page';
import { useNavigate } from '@tanstack/react-router';
import { useSession } from '@/src/lib/auth-client';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: vi.fn(),
    Link: ({ children, ...props }: { children: ReactNode; to: string }) => (
      <a href={props.to}>{children}</a>
    ),
  };
});

vi.mock('@/src/lib/auth-client', () => ({
  signIn: { email: vi.fn() },
  useSession: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
    vi.mocked(useSession).mockReturnValue({
      data: null,
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: () => {},
    } as ReturnType<typeof useSession>);
  });

  it('renders login form with indigo card and amber button', () => {
    const { container } = render(<LoginPage />);
    expect(screen.getByText('Bem-vindo ao Jogo')).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeTruthy();
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByText('Criar conta')).toBeInTheDocument();
  });
});
