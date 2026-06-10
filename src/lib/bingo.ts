export interface BingoCard {
  B: number[];
  I: number[];
  N: (number | 'FREE')[];
  G: number[];
  O: number[];
}

export function getRandomNumbers(min: number, max: number, count: number): number[] {
  const numbers: number[] = [];
  while (numbers.length < count) {
    const number = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(number)) {
      numbers.push(number);
    }
  }
  return numbers.sort((a, b) => a - b);
}

export function generateBingoCard75(): BingoCard {
  const card: BingoCard = {
    B: getRandomNumbers(1, 15, 5),
    I: getRandomNumbers(16, 30, 5),
    N: getRandomNumbers(31, 45, 5),
    G: getRandomNumbers(46, 60, 5),
    O: getRandomNumbers(61, 75, 5),
  };

  card.N[2] = 'FREE';

  return card;
}

export function cardSignature(card: BingoCard): string {
  return JSON.stringify(card);
}

export function generateUniqueCards(quantity: number): BingoCard[] {
  const cards: BingoCard[] = [];
  const signatures = new Set<string>();

  while (cards.length < quantity) {
    const card = generateBingoCard75();
    const signature = cardSignature(card);

    if (!signatures.has(signature)) {
      signatures.add(signature);
      cards.push(card);
    }

    // Safety break
    if (signatures.size > 1000000) break;
  }

  return cards;
}

type CellValue = number | 'FREE';

function isMarked(cell: CellValue, drawn: Set<number>): boolean {
  return cell === 'FREE' || drawn.has(cell);
}

export function checkWinner(
  card: BingoCard,
  drawnNumbers: number[],
  prizeType: 'line' | 'full',
): boolean {
  const drawn = new Set(drawnNumbers);
  const letters: (keyof BingoCard)[] = ['B', 'I', 'N', 'G', 'O'];

  if (prizeType === 'line') {
    // Horizontal lines
    for (let row = 0; row < 5; row++) {
      const rowNumbers = letters.map((l) => card[l][row] as CellValue);
      if (rowNumbers.every((n) => isMarked(n, drawn))) return true;
    }
    // Vertical lines
    for (const letter of letters) {
      const column = card[letter] as CellValue[];
      if (column.every((n) => isMarked(n, drawn))) return true;
    }
    // Diagonals
    const diag1 = letters.map((l, i) => card[l][i] as CellValue);
    if (diag1.every((n) => isMarked(n, drawn))) return true;

    const diag2 = letters.map((l, i) => card[l][4 - i] as CellValue);
    if (diag2.every((n) => isMarked(n, drawn))) return true;
  }

  if (prizeType === 'full') {
    return letters.every((l) => (card[l] as CellValue[]).every((n) => isMarked(n, drawn)));
  }

  return false;
}
