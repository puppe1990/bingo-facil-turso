import { useEffect, useState } from 'react';
import { FileSpreadsheet, Keyboard, List } from 'lucide-react';
import {
  importedCardsToText,
  parseImportedCardsCsv,
  parseImportedCardsText,
  type ImportedCardRow,
} from '../lib/import-cards';
import { ManualCardForm } from './ManualCardForm';

const IMPORT_EXAMPLE = `# Uma cartela por linha: número da cartela + 24 números (centro é FREE)
001 1 5 8 12 14 16 22 25 28 30 31 35 38 42 46 50 55 58 60 61 68 70 72 75
002 2 6 9 13 15 17 23 26 29 30 32 36 39 43 47 51 56 59 60 62 69 71 73 74`;

const CSV_EXAMPLE = `cartela,B1,B2,B3,B4,B5,I1,I2,I3,I4,I5,N1,N2,N3,N4,G1,G2,G3,G4,G5,O1,O2,O3,O4,O5
001,1,5,8,12,14,16,22,25,28,30,31,35,38,42,46,50,55,58,60,61,68,70,72,75`;

type ImportMode = 'text' | 'csv' | 'manual';

type ImportCardsPanelProps = {
  onChange: (text: string) => void;
};

export function ImportCardsPanel({ onChange }: ImportCardsPanelProps) {
  const [mode, setMode] = useState<ImportMode>('text');
  const [textValue, setTextValue] = useState(IMPORT_EXAMPLE);
  const [csvValue, setCsvValue] = useState(CSV_EXAMPLE);
  const [manualCards, setManualCards] = useState<ImportedCardRow[]>([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (mode === 'text') {
      const parsed = parseImportedCardsText(textValue);
      if (parsed.ok) {
        setFeedback(`${parsed.cards.length} cartela(s) pronta(s) para importar`);
        onChange(textValue);
      } else {
        setFeedback(parsed.error);
        onChange('');
      }
      return;
    }

    if (mode === 'csv') {
      const parsed = parseImportedCardsCsv(csvValue);
      if (parsed.ok) {
        setFeedback(`${parsed.cards.length} cartela(s) no CSV`);
        onChange(importedCardsToText(parsed.cards));
      } else {
        setFeedback(parsed.error);
        onChange('');
      }
      return;
    }

    if (manualCards.length === 0) {
      setFeedback('Cadastre ao menos uma cartela');
      onChange('');
      return;
    }

    setFeedback(`${manualCards.length} cartela(s) cadastrada(s)`);
    onChange(importedCardsToText(manualCards));
  }, [mode, textValue, csvValue, manualCards, onChange]);

  const handleCsvFile = async (file: File | null) => {
    if (!file) return;
    const content = await file.text();
    setCsvValue(content);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'text' as const, label: 'Colar texto', icon: List },
          { id: 'csv' as const, label: 'Planilha CSV', icon: FileSpreadsheet },
          { id: 'manual' as const, label: 'Cadastro visual', icon: Keyboard },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-all ${
              mode === tab.id
                ? 'bg-amber-500 text-white'
                : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'text' && (
        <textarea
          rows={10}
          className="w-full px-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-mono text-sm text-indigo-900 outline-none transition-all shadow-inner resize-y"
          placeholder="001 1 5 8 12 14 ..."
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
        />
      )}

      {mode === 'csv' && (
        <div className="space-y-4">
          <label className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-dashed border-indigo-200 cursor-pointer hover:border-indigo-300 transition-colors">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-indigo-700">Enviar arquivo .csv</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleCsvFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <textarea
            rows={8}
            className="w-full px-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-mono text-sm text-indigo-900 outline-none transition-all shadow-inner resize-y"
            value={csvValue}
            onChange={(e) => setCsvValue(e.target.value)}
          />
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest leading-relaxed">
            CSV: primeira coluna = número da cartela, depois 24 números (B, I, N sem centro, G, O).
            Aceita vírgula ou ponto-e-vírgula. Linha de cabeçalho opcional.
          </p>
        </div>
      )}

      {mode === 'manual' && <ManualCardForm cards={manualCards} onCardsChange={setManualCards} />}

      <p
        className={`text-xs font-bold ${
          feedback.includes('cartela') &&
          !feedback.includes('ao menos') &&
          !feedback.includes('Linha')
            ? 'text-emerald-600'
            : 'text-indigo-400'
        }`}
      >
        {feedback}
      </p>
    </div>
  );
}
