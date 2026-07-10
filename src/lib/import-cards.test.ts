import { describe, it, expect } from 'vitest';
import {
  numbersToBingoCard,
  validateBingoCard75,
  parseImportedCardsText,
  parseImportedCardsCsv,
  importedCardsToText,
  manualGridToCardRow,
  type ImportedCardRow,
} from './import-cards';
import type { BingoCard } from './bingo';

const validCard: BingoCard = {
  B: [1, 5, 8, 12, 14],
  I: [16, 22, 25, 28, 30],
  N: [31, 35, 'FREE', 38, 42],
  G: [46, 50, 55, 58, 60],
  O: [61, 68, 70, 72, 75],
};

describe('numbersToBingoCard', () => {
  it('builds a 75-ball card from 24 numbers with FREE in center', () => {
    const numbers = [
      1, 5, 8, 12, 14, 16, 22, 25, 28, 30, 31, 35, 38, 42, 46, 50, 55, 58, 60, 61, 68, 70, 72, 75,
    ];
    expect(numbersToBingoCard(numbers)).toEqual(validCard);
  });
});

describe('validateBingoCard75', () => {
  it('accepts a valid 75-ball card', () => {
    expect(validateBingoCard75(validCard)).toEqual({ ok: true });
  });

  it('rejects B column numbers outside 1-15', () => {
    const card = { ...validCard, B: [1, 5, 8, 12, 16] };
    expect(validateBingoCard75(card).ok).toBe(false);
  });

  it('rejects when center is not FREE', () => {
    const card = { ...validCard, N: [31, 35, 40, 38, 42] };
    expect(validateBingoCard75(card).ok).toBe(false);
  });

  it('rejects duplicate numbers within the same column', () => {
    const card = { ...validCard, B: [1, 1, 8, 12, 14] };
    expect(validateBingoCard75(card).ok).toBe(false);
  });
});

describe('parseImportedCardsText', () => {
  it('parses one card per line with card number and 24 numbers', () => {
    const text = '001 1 5 8 12 14 16 22 25 28 30 31 35 38 42 46 50 55 58 60 61 68 70 72 75';
    const result = parseImportedCardsText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].cardNumber).toBe('001');
    expect(result.cards[0].numbers).toEqual(validCard);
  });

  it('parses comma-separated values', () => {
    const text = '002,1,5,8,12,14,16,22,25,28,30,31,35,38,42,46,50,55,58,60,61,68,70,72,75';
    const result = parseImportedCardsText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cards[0].cardNumber).toBe('002');
  });

  it('parses multiple cards and ignores blank lines and comments', () => {
    const text = `
# minhas cartelas prontas
001 1 5 8 12 14 16 22 25 28 30 31 35 38 42 46 50 55 58 60 61 68 70 72 75

002 2 6 9 13 15 17 23 26 29 30 32 36 39 43 47 51 56 59 60 62 69 71 73 74
    `;
    const result = parseImportedCardsText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cards).toHaveLength(2);
  });

  it('rejects lines with wrong number count', () => {
    const text = '001 1 5 8 12 14';
    const result = parseImportedCardsText(text);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/24 números/i);
  });

  it('rejects invalid bingo values', () => {
    const text = '001 1 5 8 12 99 16 22 25 28 30 31 35 38 42 44 46 50 55 58 60 61 68 70 72 75';
    const result = parseImportedCardsText(text);
    expect(result.ok).toBe(false);
  });

  it('rejects duplicate card numbers', () => {
    const text = `
001 1 5 8 12 14 16 22 25 28 30 31 35 38 42 46 50 55 58 60 61 68 70 72 75
001 2 6 9 13 15 17 23 26 29 30 32 36 39 43 47 51 56 59 60 62 69 71 73 74
    `;
    const result = parseImportedCardsText(text);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/duplicad/i);
  });

  it('round-trips cards through importedCardsToText', () => {
    const text = '001 1 5 8 12 14 16 22 25 28 30 31 35 38 42 46 50 55 58 60 61 68 70 72 75';
    const parsed = parseImportedCardsText(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const serialized = importedCardsToText(parsed.cards);
    const reparsed = parseImportedCardsText(serialized);
    expect(reparsed.ok).toBe(true);
    if (!reparsed.ok) return;
    expect(reparsed.cards[0]).toEqual(parsed.cards[0]);
  });
});

describe('parseImportedCardsCsv', () => {
  it('parses CSV with header row', () => {
    const csv = `cartela,B1,B2,B3,B4,B5,I1,I2,I3,I4,I5,N1,N2,N3,N4,G1,G2,G3,G4,G5,O1,O2,O3,O4,O5
001,1,5,8,12,14,16,22,25,28,30,31,35,38,42,46,50,55,58,60,61,68,70,72,75`;

    const result = parseImportedCardsCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0].cardNumber).toBe('001');
    expect(result.cards[0].numbers).toEqual(validCard);
  });

  it('parses semicolon-separated CSV without header', () => {
    const csv = '002;2;6;9;13;15;17;23;26;29;30;32;36;39;43;47;51;56;59;60;62;69;71;73;74';
    const result = parseImportedCardsCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cards[0].cardNumber).toBe('002');
  });

  it('rejects CSV rows with missing columns', () => {
    const csv = 'cartela,B1,B2\n001,1,5';
    const result = parseImportedCardsCsv(csv);
    expect(result.ok).toBe(false);
  });
});

describe('manualGridToCardRow', () => {
  it('builds a valid card row from the visual grid inputs', () => {
    const result = manualGridToCardRow('015', {
      B: ['1', '5', '8', '12', '14'],
      I: ['16', '22', '25', '28', '30'],
      N: ['31', '35', '', '38', '42'],
      G: ['46', '50', '55', '58', '60'],
      O: ['61', '68', '70', '72', '75'],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.card?.cardNumber).toBe('015');
    expect(result.card?.numbers.N[2]).toBe('FREE');
  });

  it('rejects manual grid with empty cells', () => {
    const result = manualGridToCardRow('015', {
      B: ['1', '', '8', '12', '14'],
      I: ['16', '22', '25', '28', '30'],
      N: ['31', '35', '', '38', '42'],
      G: ['46', '50', '55', '58', '60'],
      O: ['61', '68', '70', '72', '75'],
    });

    expect(result.ok).toBe(false);
  });
});

describe('manualGridToCardRow duplicate check', () => {
  it('rejects when card number already exists in list', () => {
    const existing: ImportedCardRow[] = [{ cardNumber: '001', numbers: validCard }];
    const result = manualGridToCardRow(
      '001',
      {
        B: ['2', '6', '9', '13', '15'],
        I: ['17', '23', '26', '29', '30'],
        N: ['32', '36', '', '39', '43'],
        G: ['47', '51', '56', '59', '60'],
        O: ['62', '69', '71', '73', '74'],
      },
      existing,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/duplicad/i);
  });
});
