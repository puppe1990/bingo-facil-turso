import { useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Calendar, Ticket, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { createEventFn } from '../server/events.functions';

export function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    eventDate: new Date().toISOString().split('T')[0],
    totalCards: 100,
    bingoType: '75',
    footerText: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const eventId = await createEventFn({ data: formData });
      navigate({ to: '/event/$eventId', params: { eventId } });
    } catch (err) {
      console.error('Failed to create event', err);
      setError('Não foi possível criar o evento. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <button
        onClick={() => navigate({ to: '/' })}
        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-600 mb-8 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-full transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para os Eventos
      </button>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 border-2 border-indigo-50 overflow-hidden">
        <div className="bg-indigo-900 p-12 text-white relative flex flex-col justify-center overflow-hidden">
          <Sparkles className="absolute -right-12 -bottom-12 w-64 h-64 opacity-10 rotate-12" />
          <div className="relative z-10">
            <div className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] mb-2">Novo Evento</div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Configuração de Bingo</h1>
            <p className="text-indigo-300 font-medium mt-2">Personalize as regras e gere cartelas únicas instantaneamente.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-8">
            <div className="group">
              <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">Nome do Bingo</label>
              <input
                type="text"
                required
                className="w-full px-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all placeholder:text-indigo-200 text-lg shadow-inner"
                placeholder="Ex: Show de Prêmios Beneficente"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">Data do Sorteio</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="date"
                    required
                    className="w-full pl-12 pr-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all shadow-inner"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">Qtd. de Cartelas</label>
                <div className="relative group">
                  <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    className="w-full pl-12 pr-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all shadow-inner"
                    value={formData.totalCards}
                    onChange={(e) => setFormData({ ...formData, totalCards: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Capacidade MVP: 1000</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-3">Texto no Rodapé das Cartelas</label>
              <input
                type="text"
                className="w-full px-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all placeholder:text-indigo-200 shadow-inner"
                placeholder="Ex: Valor R$ 10,00 - Sua ajuda é fundamental!"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white h-24 rounded-3xl font-black text-xl hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-100 hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-widest flex items-center justify-center gap-4 border-b-8 border-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  Gerando Cartelas Únicas...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 fill-current text-white/50" />
                  Gerar e Finalizar Evento
                </>
              )}
            </button>
            <p className="text-center text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-4">
              Ao criar, garantimos que nenhuma cartela seja repetida.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}