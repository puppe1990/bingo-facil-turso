import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  manualGridToCardRow,
  type ImportedCardRow,
  type ManualCardGrid,
} from '../lib/import-cards';

const COLUMN_META = [
  { key: 'B' as const, label: 'B', min: 1, max: 15 },
  { key: 'I' as const, label: 'I', min: 16, max: 30 },
  { key: 'N' as const, label: 'N', min: 31, max: 45 },
  { key: 'G' as const, label: 'G', min: 46, max: 60 },
  { key: 'O' as const, label: 'O', min: 61, max: 75 },
];

function emptyGrid(): ManualCardGrid {
  return {
    B: ['', '', '', '', ''],
    I: ['', '', '', '', ''],
    N: ['', '', '', '', ''],
    G: ['', '', '', '', ''],
    O: ['', '', '', '', ''],
  };
}

type ManualCardFormProps = {
  cards: ImportedCardRow[];
  onCardsChange: (cards: ImportedCardRow[]) => void;
};

export function ManualCardForm({ cards, onCardsChange }: ManualCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [grid, setGrid] = useState<ManualCardGrid>(emptyGrid);
  const [error, setError] = useState('');

  const updateCell = (column: keyof ManualCardGrid, row: number, value: string) => {
    setGrid((prev) => {
      const next = { ...prev, [column]: [...prev[column]] };
      next[column][row] = value;
      return next;
    });
  };

  const handleAddCard = () => {
    const result = manualGridToCardRow(cardNumber, grid, cards);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    onCardsChange([...cards, result.card]);
    setCardNumber('');
    setGrid(emptyGrid());
    setError('');
  };

  const handleRemoveCard = (index: number) => {
    onCardsChange(cards.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-6 space-y-5">
        <div>
          <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">
            Número da cartela
          </label>
          <input
            type="text"
            className="w-full max-w-xs px-4 py-3 bg-white border-2 border-transparent focus:border-indigo-200 rounded-xl font-bold text-indigo-900 outline-none"
            placeholder="Ex: 001"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse">
            <thead>
              <tr>
                {COLUMN_META.map((column) => (
                  <th
                    key={column.key}
                    className="px-2 py-2 text-center text-xs font-black text-indigo-400 uppercase tracking-widest"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, row) => (
                <tr key={row}>
                  {COLUMN_META.map((column) => {
                    const isFree = column.key === 'N' && row === 2;
                    return (
                      <td key={`${column.key}-${row}`} className="p-1">
                        {isFree ? (
                          <div className="h-11 flex items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-black text-xs">
                            FREE
                          </div>
                        ) : (
                          <input
                            type="number"
                            min={column.min}
                            max={column.max}
                            className="w-full h-11 px-2 text-center bg-white border-2 border-transparent focus:border-indigo-200 rounded-xl font-bold text-indigo-900 outline-none"
                            value={grid[column.key][row]}
                            onChange={(e) => updateCell(column.key, row, e.target.value)}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleAddCard}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white font-black text-sm uppercase tracking-wide hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar cartela
        </button>
      </div>

      {cards.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-black text-indigo-300 uppercase tracking-widest">
            {cards.length} cartela(s) cadastrada(s)
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cards.map((card, index) => (
              <div
                key={`${card.cardNumber}-${index}`}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-indigo-100"
              >
                <span className="font-bold text-indigo-900">Cartela {card.cardNumber}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCard(index)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  aria-label={`Remover cartela ${card.cardNumber}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
