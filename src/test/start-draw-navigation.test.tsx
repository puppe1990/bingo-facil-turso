import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routeTree } from '../routeTree.gen';

const { mockEvent, mockCards } = vi.hoisted(() => ({
  mockEvent: {
    id: 'event-abc-123',
    userId: 'user-1',
    name: 'Bingo Teste',
    eventDate: '2026-06-10',
    totalCards: 2,
    footerText: '',
    bingoType: '75',
    status: 'active',
    drawnNumbers: [] as number[],
    createdAt: new Date(),
    updatedAt: null,
  },
  mockCards: [
    {
      id: 'card-1',
      eventId: 'event-abc-123',
      userId: 'user-1',
      cardNumber: '000001',
      numbers: {
        B: [1, 2, 3, 4, 5],
        I: [16, 17, 18, 19, 20],
        N: [31, 32, 0, 34, 35],
        G: [46, 47, 48, 49, 50],
        O: [61, 62, 63, 64, 65],
      },
      status: 'available',
      buyerName: null,
      buyerPhone: null,
      createdAt: new Date(),
      updatedAt: null,
    },
  ],
}));

vi.mock('../server/auth.functions', () => ({
  getSessionFn: vi.fn().mockResolvedValue({
    user: { id: 'user-1', name: 'Organizador', email: 'org@test.com' },
    session: { id: 'session-1' },
  }),
}));

vi.mock('../server/events.functions', () => ({
  getEventFn: vi.fn().mockResolvedValue(mockEvent),
  listCardsFn: vi.fn().mockResolvedValue(mockCards),
  listEventsFn: vi.fn().mockResolvedValue([]),
  drawNumberFn: vi.fn().mockResolvedValue([42]),
  resetDrawFn: vi.fn().mockResolvedValue([]),
  createEventFn: vi.fn(),
  deleteEventFn: vi.fn(),
  sellCardFn: vi.fn(),
  listSoldCardsFn: vi.fn().mockResolvedValue([]),
}));

vi.mock('../server/subscriptions.functions', () => ({
  getUserSubscriptionFn: vi.fn().mockResolvedValue(null),
}));

vi.mock('../server/user-access.functions', () => ({
  assertUserCanAccessFn: vi.fn().mockResolvedValue({
    ok: true,
    access: {
      isActive: true,
      accessExpiresAt: new Date('2026-12-31'),
      effectiveStatus: 'active',
      canAccess: true,
    },
  }),
  getUserAccessForSessionFn: vi.fn().mockResolvedValue({
    isActive: true,
    accessExpiresAt: new Date('2026-12-31'),
    effectiveStatus: 'active',
    canAccess: true,
  }),
}));

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: { speak: vi.fn(), cancel: vi.fn() },
});

async function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({
    routeTree,
    history,
    defaultPreload: 'intent',
  });

  render(<RouterProvider router={router} />);
  await router.load();
  return router;
}

describe('Iniciar Sorteio navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates from event manage to live draw when clicking Iniciar Sorteio', async () => {
    const router = await renderAt('/event/event-abc-123');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bingo Teste' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('link', { name: /iniciar sorteio/i }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/event/event-abc-123/live');
      expect(screen.getByRole('heading', { name: 'Sorteio ao Vivo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sortear pedra/i })).toBeInTheDocument();
    });
  });

  it('renders live draw directly at /event/$eventId/live', async () => {
    await renderAt('/event/event-abc-123/live');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sorteio ao Vivo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sortear pedra/i })).toBeInTheDocument();
    });
  });
});
