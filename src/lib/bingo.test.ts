import { describe, it, expect } from 'vitest';
import {
  generateBingoCard75,
  generateUniqueCards,
  checkWinner,
  type BingoCard,
} from './bingo';

describe('generateBingoCard75', () => {
  it('creates a card with FREE in the center N column', () => {
    const card = generateBingoCard75();
    expect(card.N[2]).toBe('FREE');
  });

  it('places numbers in correct column ranges', () => {
    const card = generateBingoCard75();
    card.B.forEach((n) => expect(n).toBeGreaterThanOrEqual(1));
    card.B.forEach((n) => expect(n).toBeLessThanOrEqual(15));
    card.O.forEach((n) => expect(n).toBeGreaterThanOrEqual(61));
    card.O.forEach((n) => expect(n).toBeLessThanOrEqual(75));
  });
});

describe('generateUniqueCards', () => {
  it('generates the requested quantity of unique cards', () => {
    const cards = generateUniqueCards(10);
    expect(cards).toHaveLength(10);
    const signatures = new Set(cards.map((c) => JSON.stringify(c)));
    expect(signatures.size).toBe(10);
  });
});

describe('checkWinner', () => {
  const fullCard: BingoCard = {
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 'FREE', 34, 35],
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  };

  it('detects full card winner when all numbers are drawn', () => {
    const drawn = [
      1, 2, 3, 4, 5,
      16, 17, 18, 19, 20,
      31, 32, 34, 35,
      46, 47, 48, 49, 50,
      61, 62, 63, 64, 65,
    ];
    expect(checkWinner(fullCard, drawn, 'full')).toBe(true);
  });

  it('does not detect full winner when numbers are missing', () => {
    expect(checkWinner(fullCard, [1, 2, 3], 'full')).toBe(false);
  });

  it('detects horizontal line winner', () => {
    const drawn = [1, 16, 31, 32, 34, 35, 46, 61];
    expect(checkWinner(fullCard, drawn, 'line')).toBe(true);
  });
});