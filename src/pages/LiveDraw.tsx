import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Route as LiveDrawRoute } from '../app/_authenticated/event/$eventId/live';
import { drawNumberFn, getEventFn, resetDrawFn } from '../server/events.functions';
import { checkWinner, BingoCard } from '../lib/bingo';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  Monitor,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
  ListRestart,
  Ticket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardData {
  id: string;
  cardNumber: string;
  status: string;
  buyerName?: string;
  numbers: BingoCard;
}

export function LiveDraw() {
  const { eventId } = useParams({ from: '/_authenticated/event/$eventId/live' });
  const loaderData = LiveDrawRoute.useLoaderData();
  const [cards, setCards] = useState<CardData[]>(loaderData.cards as CardData[]);
  const [winners, setWinners] = useState<CardData[]>([]);
  const [isProjection, setIsProjection] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const {
    data: event,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['event-draw', eventId],
    queryFn: () => getEventFn({ data: { eventId } }),
    initialData: loaderData.event,
    refetchInterval: 1500,
    enabled: !!eventId,
  });

  const drawnNumbers = event?.drawnNumbers ?? [];
  const loading = isLoading && !event;

  const lastNumber = drawnNumbers[drawnNumbers.length - 1];

  // Derive winners from current drawnNumbers and cards
  useEffect(() => {
    if (cards.length === 0 || drawnNumbers.length === 0) {
      setWinners([]);
      return;
    }

    const newWinners: CardData[] = [];
    cards.forEach((card) => {
      if (checkWinner(card.numbers, drawnNumbers, 'full')) {
        newWinners.push(card);
      }
    });
    setWinners(newWinners);
  }, [cards, drawnNumbers]);

  const drawNumber = useCallback(async () => {
    if (drawnNumbers.length >= 75 || !eventId) return;

    try {
      const newDrawn = await drawNumberFn({ data: { eventId } });
      await refetch();

      if (soundEnabled) {
        const next = newDrawn[newDrawn.length - 1];
        const utter = new SpeechSynthesisUtterance(String(next));
        utter.lang = 'pt-BR';
        window.speechSynthesis.speak(utter);
      }
    } catch (error) {
      console.error('Failed to draw number', error);
    }
  }, [drawnNumbers.length, eventId, refetch, soundEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !loading) {
        e.preventDefault();
        drawNumber();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawNumber, loading]);

  const resetDraw = async () => {
    if (!eventId) return;
    if (confirm('Deseja reiniciar o sorteio? Todos os números serão limpos.')) {
      try {
        await resetDrawFn({ data: { eventId } });
        await refetch();
      } catch (error) {
        console.error('Failed to reset draw', error);
      }
    }
  };

  if (loading || !event)
    return (
      <div className="flex justify-center py-20">
        <RotateCcw className="animate-spin" />
      </div>
    );

  const letters = ['B', 'I', 'N', 'G', 'O'];

  if (isProjection) {
    return (
      <div className="fixed inset-0 bg-indigo-900 text-white p-12 flex flex-col font-sans overflow-hidden z-[100]">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center text-indigo-900 font-black text-3xl shadow-xl">
              B
            </div>
            <div>
              <h1 className="text-5xl font-black uppercase tracking-tighter">{event.name}</h1>
              <p className="text-indigo-300 text-2xl font-bold">Sorteio ao Vivo</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={drawNumber}
              disabled={drawnNumbers.length >= 75}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" />
              SORTEAR AGORA
            </button>
            <button
              onClick={() => setIsProjection(false)}
              className="bg-white/10 px-6 py-3 rounded-xl hover:bg-white/20 font-bold transition-all text-sm uppercase tracking-widest"
            >
              Sair do Telão
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-12 items-center">
          <div className="col-span-5 flex flex-col items-center">
            <div className="text-indigo-300 text-2xl font-black mb-8 uppercase tracking-[0.3em]">
              Última Pedra
            </div>
            <motion.div
              key={lastNumber}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-[28rem] h-[28rem] bg-gradient-to-br from-amber-300 to-amber-500 text-indigo-900 rounded-full flex flex-col items-center justify-center shadow-[0_0_120px_rgba(251,191,36,0.3)] border-[16px] border-white relative"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20" />
              {lastNumber && (
                <span className="text-7xl font-black opacity-60 leading-none mb-2">
                  {letters[Math.floor((lastNumber - 1) / 15)]}
                </span>
              )}
              <span className="text-[180px] leading-none font-black tracking-tighter">
                {lastNumber || '--'}
              </span>
            </motion.div>

            <div className="mt-16 w-full max-w-md">
              <div className="text-indigo-300 text-sm font-black mb-6 uppercase tracking-widest text-center">
                🏆 Ganhadores em Tempo Real
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {winners.map((w) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-rose-500 text-white p-6 rounded-3xl flex items-center gap-4 shadow-2xl border-2 border-white/20"
                    >
                      <Trophy className="w-10 h-10 text-amber-300" />
                      <div>
                        <div className="text-xs font-black opacity-80 uppercase tracking-widest italic">
                          BINGO! Cartela #{w.cardNumber}
                        </div>
                        <div className="text-2xl font-black leading-tight">{w.buyerName}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {winners.length === 0 && (
                  <div className="text-center text-indigo-400 font-bold italic opacity-40">
                    Aguardando primeiro vencedor...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-7 bg-indigo-950/60 p-10 rounded-[3rem] border-2 border-white/5 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-5 gap-4 mb-8">
              {letters.map((l, idx) => (
                <div key={l} className="text-4xl font-black text-center text-indigo-400/50">
                  {l}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-15 gap-3">
              {Array.from({ length: 75 }).map((_, i) => {
                const num = i + 1;
                const isDrawn = drawnNumbers.includes(num);
                return (
                  <div
                    key={num}
                    className={`aspect-square flex items-center justify-center rounded-xl text-xl font-black transition-all duration-500 ${
                      isDrawn
                        ? 'bg-amber-400 text-indigo-900 shadow-[0_0_20px_rgba(251,191,36,0.5)] scale-110'
                        : 'bg-white/5 text-white/10'
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <Link
            to="/event/$eventId"
            params={{ eventId }}
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-600 mb-2 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Painel do Evento
          </Link>
          <h1 className="text-4xl font-black text-indigo-900 uppercase tracking-tight">
            Sorteio ao Vivo
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-4 rounded-2xl border-2 transition-all shadow-sm ${
              soundEnabled
                ? 'bg-white border-indigo-100 text-indigo-600'
                : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
          <button
            onClick={resetDraw}
            className="p-4 bg-white border-2 border-indigo-100 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-indigo-400 transition-all shadow-sm"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsProjection(true)}
            className="flex items-center gap-3 bg-indigo-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 uppercase text-sm"
          >
            <Monitor className="w-5 h-5 text-amber-400" />
            Modo Telão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Console */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white p-12 rounded-[3.5rem] border-2 border-indigo-50 shadow-2xl shadow-indigo-100/50 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 capitalize bg-amber-400" />
            <div className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] mb-8">
              Status: Rodada em Andamento
            </div>

            <div className="relative flex items-center justify-center group">
              <div className="absolute inset-x-[-100%] inset-y-[-100%] bg-indigo-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-1000 opacity-20" />
              <motion.div
                key={lastNumber}
                initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="w-72 h-72 bg-gradient-to-br from-amber-300 to-amber-500 text-indigo-900 rounded-full flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(251,191,36,0.4)] border-[12px] border-white relative z-10"
              >
                <span className="text-4xl font-black opacity-60 leading-none mb-1">
                  {lastNumber ? letters[Math.floor((lastNumber - 1) / 15)] : ''}
                </span>
                <span className="text-[120px] leading-none font-black tracking-tighter">
                  {lastNumber || '--'}
                </span>
              </motion.div>
            </div>

            <button
              onClick={drawNumber}
              disabled={drawnNumbers.length >= 75}
              className="mt-12 bg-emerald-500 hover:bg-emerald-600 text-white w-full max-w-md h-24 rounded-3xl text-2xl font-black shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:opacity-30 disabled:pointer-events-none uppercase tracking-widest flex items-center justify-center gap-4 border-b-8 border-emerald-700"
            >
              <div className="bg-white/20 p-2 rounded-lg">
                <Play className="fill-current w-6 h-6" />
              </div>
              Sortear Pedra
            </button>

            <div className="mt-10 flex gap-12 text-sm font-black">
              <div className="flex flex-col items-center">
                <span className="text-indigo-300 uppercase tracking-widest text-[10px] mb-1">
                  Sorteados
                </span>
                <span className="text-2xl text-indigo-900">{drawnNumbers.length}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-indigo-300 uppercase tracking-widest text-[10px] mb-1">
                  Restantes
                </span>
                <span className="text-2xl text-indigo-900">{75 - drawnNumbers.length}</span>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-indigo-50 w-full max-w-md">
              <div className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-4 text-center">
                Conferência Rápida
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors">
                  #
                </div>
                <input
                  type="text"
                  placeholder="Digite o número da cartela..."
                  className="w-full pl-10 pr-4 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all placeholder:text-indigo-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const num = (e.target as HTMLInputElement).value.padStart(6, '0');
                      const found = cards.find((c) => c.cardNumber === num);
                      if (found) {
                        const isWin = checkWinner(found.numbers, drawnNumbers, 'full');
                        alert(
                          isWin
                            ? `🏆 BINGO! A cartela ${num} (${found.buyerName}) ESTÁ PREMIADA!`
                            : `❌ Ainda não... A cartela ${num} possui números extras pendentes.`,
                        );
                      } else {
                        alert('⚠️ Cartela não encontrada ou não registrada como vendida.');
                      }
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Winners & History */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-rose-500 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-rose-100 relative overflow-hidden min-h-[400px]">
            <Trophy className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12" />

            <div className="flex items-center justify-between mb-8 relative">
              <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
                <span>🏆</span> Ganhadores
              </h3>
              <div className="bg-white text-rose-600 text-xs font-black px-3 py-1 rounded-full ring-4 ring-rose-400">
                {winners.length}
              </div>
            </div>

            {winners.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 relative">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20 animate-pulse">
                  <Ticket className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-sm font-bold text-rose-100 uppercase tracking-widest leading-relaxed">
                  Aguardando o<br />
                  Grito de Bingo!
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {winners.map((w) => (
                  <motion.div
                    key={w.id}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="p-5 bg-white/20 border-2 border-white/30 rounded-3xl backdrop-blur-md shadow-lg"
                  >
                    <div className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em] mb-1">
                      Bingo Confirmado!
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-2xl font-black leading-tight">{w.buyerName}</div>
                        <div className="text-xs font-bold opacity-70">Cartela #{w.cardNumber}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Mini Statistics/Footer Info */}
          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                  Tipo Bingo
                </div>
                <div className="text-lg font-black text-amber-400">75 Pedras</div>
              </div>
              <div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">
                  Voz Ativa
                </div>
                <div className="text-lg font-black text-emerald-400">
                  {soundEnabled ? 'Sim' : 'Não'}
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-indigo-800 flex justify-between items-center">
              <div className="text-xs font-bold text-indigo-300">
                Dica: Aperte ESPAÇO para sortear
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Grid Section */}
      <div className="bg-white p-10 rounded-[3rem] border-2 border-indigo-50 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-indigo-300 uppercase tracking-[0.4em]">
            Painel Completo de Pedras
          </h3>
          <div className="flex gap-2">
            {letters.map((l) => (
              <div
                key={l}
                className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-black text-indigo-400"
              >
                {l}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-3">
          {Array.from({ length: 75 }).map((_, i) => {
            const n = i + 1;
            const active = drawnNumbers.includes(n);
            const isLast = n === lastNumber;
            return (
              <div
                key={n}
                className={`aspect-square flex items-center justify-center rounded-xl text-lg font-black transition-all duration-300 ${
                  active
                    ? isLast
                      ? 'bg-amber-400 text-indigo-900 ring-4 ring-amber-200 scale-110 shadow-lg'
                      : 'bg-indigo-600 text-white shadow-md'
                    : 'bg-indigo-50/50 text-indigo-100 border border-transparent'
                }`}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
