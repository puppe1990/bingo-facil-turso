import type { BingoCard } from './bingo';

export type ImportedCardRow = {
  cardNumber: string;
  numbers: BingoCard;
};

export type ManualCardGrid = {
  B: string[];
  I: string[];
  N: string[];
  G: string[];
  O: string[];
};

type ValidationResult = { ok: true } | { ok: false; error: string };
type ParseResult = { ok: true; cards: ImportedCardRow[] } | { ok: false; error: string };
type CardRowResult = { ok: true; card: ImportedCardRow } | { ok: false; error: string };

const COLUMN_RANGES: { key: keyof BingoCard; min: number; max: number }[] = [
  { key: 'B', min: 1, max: 15 },
  { key: 'I', min: 16, max: 30 },
  { key: 'N', min: 31, max: 45 },
  { key: 'G', min: 46, max: 60 },
  { key: 'O', min: 61, max: 75 },
];

export function bingoCardToFlatNumbers(card: BingoCard): number[] {
  const nNumbers = card.N.filter((value): value is number => typeof value === 'number');
  return [...card.B, ...card.I, ...nNumbers, ...card.G, ...card.O];
}

export function importedCardsToText(cards: ImportedCardRow[]): string {
  return cards
    .map((card) => `${card.cardNumber} ${bingoCardToFlatNumbers(card.numbers).join(' ')}`)
    .join('\n');
}

export function numbersToBingoCard(numbers: number[]): BingoCard {
  if (numbers.length !== 24) {
    throw new Error(`Expected 24 numbers, got ${numbers.length}`);
  }

  let index = 0;
  const take = (count: number) => numbers.slice(index, (index += count));

  return {
    B: take(5),
    I: take(5),
    N: [...take(2), 'FREE', ...take(2)],
    G: take(5),
    O: take(5),
  };
}

function columnNumbers(column: readonly (number | 'FREE')[]): number[] {
  return column.filter((value): value is number => typeof value === 'number');
}

export function validateBingoCard75(card: BingoCard): ValidationResult {
  for (const { key, min, max } of COLUMN_RANGES) {
    const column = card[key] as readonly (number | 'FREE')[];
    const numericValues = columnNumbers(column);

    if (key === 'N' && column[2] !== 'FREE') {
      return { ok: false, error: 'Coluna N deve ter FREE no centro' };
    }

    if (numericValues.length !== (key === 'N' ? 4 : 5)) {
      return { ok: false, error: `Coluna ${key} com quantidade inválida` };
    }

    for (const value of numericValues) {
      if (value < min || value > max) {
        return {
          ok: false,
          error: `Número ${value} fora da faixa da coluna ${key} (${min}-${max})`,
        };
      }
    }

    if (new Set(numericValues).size !== numericValues.length) {
      return { ok: false, error: `Números duplicados na coluna ${key}` };
    }
  }

  return { ok: true };
}

function tokenizeLine(line: string): string[] {
  return line
    .split(/[,;\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function detectDelimiter(line: string): ',' | ';' {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semicolons > commas ? ';' : ',';
}

function parseCsvLine(line: string, delimiter: ',' | ';'): string[] {
  return line
    .split(delimiter)
    .map((token) => token.trim())
    .filter(Boolean);
}

function isHeaderRow(tokens: string[]): boolean {
  const first = tokens[0]?.toLowerCase() ?? '';
  return first.includes('cartela') || first.includes('numero') || first.includes('número');
}

function parseCsvRow(tokens: string[], lineNumber: number): CardRowResult {
  if (tokens.length < 25) {
    return {
      ok: false,
      error: `Linha ${lineNumber}: CSV deve ter número da cartela e 24 colunas de números`,
    };
  }

  const [cardNumber, ...numberTokens] = tokens.slice(0, 25);
  const numbers = numberTokens.map((token) => Number(token));
  if (numbers.some((value) => !Number.isInteger(value))) {
    return { ok: false, error: `Linha ${lineNumber}: use apenas números inteiros no CSV` };
  }

  const bingoCard = numbersToBingoCard(numbers);
  const validation = validateBingoCard75(bingoCard);
  if (!validation.ok) {
    return { ok: false, error: `Linha ${lineNumber}: ${validation.error}` };
  }

  return { ok: true, card: { cardNumber, numbers: bingoCard } };
}

export function parseImportedCardsCsv(csv: string): ParseResult {
  const normalized = csv.replace(/^\uFEFF/, '').trim();
  if (!normalized) {
    return { ok: false, error: 'Informe ao menos uma cartela no CSV' };
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { ok: false, error: 'Informe ao menos uma cartela no CSV' };
  }

  const delimiter = detectDelimiter(lines[0]);
  const firstTokens = parseCsvLine(lines[0], delimiter);
  const dataLines = isHeaderRow(firstTokens) ? lines.slice(1) : lines;

  if (dataLines.length === 0) {
    return { ok: false, error: 'CSV sem linhas de cartelas' };
  }

  const cards: ImportedCardRow[] = [];
  const seenNumbers = new Set<string>();

  for (let i = 0; i < dataLines.length; i++) {
    const tokens = parseCsvLine(dataLines[i], delimiter);
    const lineNumber = isHeaderRow(firstTokens) ? i + 2 : i + 1;
    const rowResult = parseCsvRow(tokens, lineNumber);
    if (!rowResult.ok) {
      return { ok: false, error: rowResult.error };
    }

    if (seenNumbers.has(rowResult.card.cardNumber)) {
      return { ok: false, error: `Número de cartela duplicado: ${rowResult.card.cardNumber}` };
    }

    seenNumbers.add(rowResult.card.cardNumber);
    cards.push(rowResult.card);
  }

  return { ok: true, cards };
}

export function manualGridToCardRow(
  cardNumber: string,
  grid: ManualCardGrid,
  existing: ImportedCardRow[] = [],
): CardRowResult {
  if (!cardNumber.trim()) {
    return { ok: false, error: 'Informe o número da cartela' };
  }

  if (existing.some((card) => card.cardNumber === cardNumber.trim())) {
    return { ok: false, error: `Número de cartela duplicado: ${cardNumber.trim()}` };
  }

  const columns: { key: keyof ManualCardGrid; count: number }[] = [
    { key: 'B', count: 5 },
    { key: 'I', count: 5 },
    { key: 'N', count: 5 },
    { key: 'G', count: 5 },
    { key: 'O', count: 5 },
  ];

  const numbers: number[] = [];

  for (const { key, count } of columns) {
    for (let row = 0; row < count; row++) {
      if (key === 'N' && row === 2) continue;

      const rawValue = grid[key][row]?.trim() ?? '';
      if (!rawValue) {
        return { ok: false, error: 'Preencha todos os números da cartela' };
      }

      const value = Number(rawValue);
      if (!Number.isInteger(value)) {
        return { ok: false, error: 'Use apenas números inteiros na cartela' };
      }

      numbers.push(value);
    }
  }

  const bingoCard = numbersToBingoCard(numbers);
  const validation = validateBingoCard75(bingoCard);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return { ok: true, card: { cardNumber: cardNumber.trim(), numbers: bingoCard } };
}

function parseLine(line: string, lineNumber: number): ParseResult & { card?: ImportedCardRow } {
  const tokens = tokenizeLine(line);
  if (tokens.length < 25) {
    return {
      ok: false,
      error: `Linha ${lineNumber}: informe o número da cartela e 24 números (centro é FREE)`,
    };
  }

  const [cardNumber, ...numberTokens] = tokens;
  if (numberTokens.length !== 24) {
    return {
      ok: false,
      error: `Linha ${lineNumber}: informe exatamente 24 números após o número da cartela`,
    };
  }

  const numbers = numberTokens.map((token) => Number(token));
  if (numbers.some((value) => !Number.isInteger(value))) {
    return { ok: false, error: `Linha ${lineNumber}: use apenas números inteiros` };
  }

  const bingoCard = numbersToBingoCard(numbers);
  const validation = validateBingoCard75(bingoCard);
  if (!validation.ok) {
    return { ok: false, error: `Linha ${lineNumber}: ${validation.error}` };
  }

  return { ok: true, cards: [], card: { cardNumber, numbers: bingoCard } };
}

export function parseImportedCardsText(text: string): ParseResult {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  if (lines.length === 0) {
    return { ok: false, error: 'Informe ao menos uma cartela para importar' };
  }

  const cards: ImportedCardRow[] = [];
  const seenNumbers = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const lineResult = parseLine(lines[i], i + 1);
    if (!lineResult.ok) {
      return { ok: false, error: lineResult.error };
    }

    const card = lineResult.card!;
    if (seenNumbers.has(card.cardNumber)) {
      return { ok: false, error: `Número de cartela duplicado: ${card.cardNumber}` };
    }

    seenNumbers.add(card.cardNumber);
    cards.push(card);
  }

  return { ok: true, cards };
}
