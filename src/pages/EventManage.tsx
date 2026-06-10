import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { deleteEventFn, getEventFn, listCardsFn, sellCardFn } from '../server/events.functions';
import { ArrowLeft, Printer, Play, Users, Ticket, CheckCircle, Search, UserPlus, Sparkles, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateEventPDF } from '../lib/pdf';

interface EventData {
  id: string;
  name: string;
  eventDate: string;
  totalCards: number;
  footerText?: string;
}

interface CardData {
  id: string;
  cardNumber: string;
  status: string;
  buyerName?: string;
  buyerPhone?: string;
  numbers: any;
}

export function EventManage() {
  const { eventId } = useParams({ from: '/_authenticated/event/$eventId' });
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingCard, setUpdatingCard] = useState<string | null>(null);
  const [sellingCardId, setSellingCardId] = useState<string | null>(null);
  const [buyerNameInput, setBuyerNameInput] = useState('');
  const [buyerPhoneInput, setBuyerPhoneInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [showPdfOptions, setShowPdfOptions] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!eventId) return;
      try {
        const eventData = await getEventFn({ data: { eventId } });
        setEvent(eventData as EventData);
        const cardsData = await listCardsFn({ data: { eventId } });
        setCards(cardsData as CardData[]);
      } catch (error) {
        console.error('Failed to load event', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [eventId]);

  const handleSellCard = async (cardId: string, buyerName: string, buyerPhone: string) => {
    if (!eventId || !buyerName) return;
    setUpdatingCard(cardId);
    try {
      await sellCardFn({ data: { eventId, cardId, buyerName, buyerPhone } });
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: 'sold', buyerName, buyerPhone } : c));
      setSellingCardId(null);
      setBuyerNameInput('');
      setBuyerPhoneInput('');
    } catch (error) {
      console.error('Failed to sell card', error);
    } finally {
      setUpdatingCard(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId) return;
    setIsDeleting(true);
    try {
      await deleteEventFn({ data: { eventId } });
      navigate({ to: '/' });
    } catch (error) {
      console.error('Failed to delete event', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const filteredCards = cards.filter(c => 
    c.cardNumber.includes(search) || 
    c.buyerName?.toLowerCase().includes(search.toLowerCase())
  );

  const soldCount = cards.filter(c => c.status === 'sold').length;

  if (loading || !event) return <div className="flex justify-center py-12 text-indigo-600 animate-spin"><Play className="w-8 h-8" /></div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-600 mb-4 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full transition-all">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <h1 className="text-5xl font-black text-indigo-900 uppercase tracking-tighter leading-none">{event.name}</h1>
          <p className="text-indigo-600 font-bold mt-2 text-lg">
            {format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center justify-center p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-100/50"
            title="Excluir Evento"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowPdfOptions(!showPdfOptions)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border-2 border-indigo-50 text-indigo-900 px-6 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-100/30 uppercase text-sm"
            >
              <Printer className="w-5 h-5 text-indigo-400" />
              Exportar PDF
            </button>
            
            {showPdfOptions && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-2xl shadow-2xl border-2 border-indigo-50 p-4 z-20 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Cartelas por Página</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[1, 2, 4, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setCardsPerPage(num)}
                      className={`py-2 rounded-xl font-black text-sm transition-all ${
                        cardsPerPage === num 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                          : 'bg-indigo-50 text-indigo-400 hover:bg-indigo-100'
                      }`}
                    >
                      {num} {num === 1 ? 'Cartela' : 'Cartelas'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    generateEventPDF(event.name, cards, event.footerText, cardsPerPage);
                    setShowPdfOptions(false);
                  }}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                >
                  Gerar PDF Agora
                </button>
              </div>
            )}
          </div>
          <Link
            to="/event/$eventId/live"
            params={{ eventId: event.id }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100/50 uppercase text-sm transform hover:-translate-y-1 active:translate-y-0"
          >
            <Play className="w-5 h-5 fill-current" />
            Iniciar Sorteio
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-xl shadow-indigo-100 flex items-center gap-6 relative overflow-hidden">
          <div className="bg-indigo-50 p-5 rounded-2xl text-indigo-600 relative z-10">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Cartelas</p>
            <p className="text-4xl font-black text-indigo-900">{event.totalCards}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50 rounded-full opacity-30" />
        </div>
        
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-xl shadow-indigo-100 flex items-center gap-6 relative overflow-hidden">
          <div className="bg-amber-50 p-5 rounded-2xl text-amber-600 relative z-10">
            <Users className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Vendidas</p>
            <p className="text-4xl font-black text-indigo-900">{soldCount}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-50 rounded-full opacity-30" />
        </div>

        <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 border-2 border-indigo-800 flex items-center gap-6 relative overflow-hidden">
          <div className="bg-white/10 p-5 rounded-2xl text-amber-400 relative z-10">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Aproveitamento</p>
            <p className="text-4xl font-black text-white">{Math.round((soldCount / event.totalCards) * 100)}%</p>
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border-2 border-indigo-50 shadow-2xl shadow-indigo-100/50 overflow-hidden relative">
        <div className="p-8 border-b-2 border-indigo-50 bg-indigo-50/20 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <h2 className="text-2xl font-black text-indigo-900 uppercase italic">Controle de Vendas</h2>
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por Nº ou Nome..."
              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-indigo-200 shadow-sm outline-none font-bold text-indigo-900 placeholder:text-indigo-200 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] bg-indigo-50/30">
                <th className="px-8 py-6">Nº Cartela</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Comprador</th>
                <th className="px-8 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-indigo-50">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-6 font-black text-indigo-900 text-lg">#{card.cardNumber}</td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-lg tracking-widest ${
                      card.status === 'sold' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm shadow-emerald-50' 
                        : 'bg-indigo-50 text-indigo-300'
                    }`}>
                      {card.status === 'sold' ? 'VENDIDA' : 'DISPONÍVEL'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-indigo-900">{card.buyerName || '---'}</span>
                      {card.buyerPhone && <span className="text-xs text-indigo-400 font-bold">{card.buyerPhone}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {card.status === 'available' ? (
                      <div className="flex justify-end gap-2">
                        {sellingCardId === card.id ? (
                          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2">
                              <input
                                autoFocus
                                type="text"
                                value={buyerNameInput}
                                onChange={(e) => setBuyerNameInput(e.target.value)}
                                placeholder="Nome Comprador"
                                className="bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-400 text-indigo-900 w-48 shadow-lg"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSellCard(card.id, buyerNameInput, buyerPhoneInput);
                                  if (e.key === 'Escape') setSellingCardId(null);
                                }}
                              />
                              <button
                                onClick={() => handleSellCard(card.id, buyerNameInput, buyerPhoneInput)}
                                disabled={!buyerNameInput || updatingCard === card.id}
                                className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setSellingCardId(null)}
                                className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-100 transition-all"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                            <input
                              type="tel"
                              value={buyerPhoneInput}
                              onChange={(e) => setBuyerPhoneInput(e.target.value)}
                              placeholder="Telefone (opcional)"
                              className="bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-indigo-400 text-indigo-900 w-full shadow-lg"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSellCard(card.id, buyerNameInput, buyerPhoneInput);
                                if (e.key === 'Escape') setSellingCardId(null);
                              }}
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSellingCardId(card.id);
                              setBuyerNameInput('');
                              setBuyerPhoneInput('');
                            }}
                            className="bg-indigo-900 text-white px-6 py-2 rounded-xl font-black text-xs hover:bg-emerald-500 transition-all shadow-lg hover:shadow-indigo-200 uppercase tracking-widest"
                          >
                             Registrar Venda
                          </button>
                        )}
                      </div>
                    ) : (
                      <button className="text-indigo-300 hover:text-indigo-600 font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ml-auto">
                        <CheckCircle className="w-4 h-4" /> Detalhes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCards.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-indigo-200">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-xl font-black uppercase italic">Nenhuma cartela encontrada</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border-2 border-indigo-50 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-indigo-900 text-center mb-2 uppercase italic">Atenção!</h3>
            <p className="text-indigo-400 text-center font-medium leading-relaxed mb-8">
              Você tem certeza que deseja excluir o evento <span className="font-bold text-indigo-900">"{event.name}"</span>? 
              Esta ação é permanente e todas as cartelas e dados do sorteio serão perdidos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="flex-1 px-8 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
