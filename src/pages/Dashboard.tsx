import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, Calendar, Users, Ticket, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { listEventsFn } from '../server/events.functions';

interface BingoEvent {
  id: string;
  name: string;
  eventDate: string;
  totalCards: number;
  status: string;
}

export function Dashboard() {
  const [events, setEvents] = useState<BingoEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await listEventsFn();
        setEvents(data as BingoEvent[]);
      } catch (error) {
        console.error('Failed to load events', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-indigo-900 leading-tight uppercase">Meus Bingos</h1>
          <p className="text-indigo-600 font-medium">Gerencie seus eventos e acompanhe as vendas.</p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all transform active:scale-95 uppercase text-sm"
        >
          <Plus className="w-5 h-5 font-black" />
          Novo Bingo
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-indigo-200 rounded-[2rem] p-16 text-center shadow-inner">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-50 p-6 rounded-full">
              <Ticket className="w-16 h-16 text-indigo-300" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-indigo-900 uppercase">Tudo pronto para começar?</h3>
          <p className="text-indigo-600 mb-8 max-w-sm mx-auto">Crie seu primeiro evento e comece a gerar cartelas profissionais em segundos.</p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 bg-indigo-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-800 transition-all"
          >
            Começar Agora <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              to="/event/$eventId"
              params={{ eventId: event.id }}
              className="group bg-white p-8 rounded-[2rem] border-2 border-indigo-50 shadow-xl shadow-indigo-100 hover:shadow-2xl hover:border-amber-200 transition-all relative overflow-hidden"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />

              <div className="flex justify-between items-start mb-6 relative">
                <div className="bg-amber-400 p-4 rounded-2xl shadow-lg border-2 border-white">
                  <Ticket className="w-8 h-8 text-indigo-900" />
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                  event.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-50'
                    : 'bg-indigo-50 text-indigo-400'
                }`}>
                  {event.status === 'active' ? '● Rodando' : 'Finalizado'}
                </span>
              </div>

              <h3 className="text-2xl font-black text-indigo-900 mb-2 truncate uppercase leading-tight">{event.name}</h3>

              <div className="space-y-3 pt-4 border-t border-indigo-50 mt-4">
                <div className="flex items-center gap-3 text-indigo-400 font-bold text-sm">
                  <Calendar className="w-5 h-5 opacity-40" />
                  {format(new Date(event.eventDate), "dd 'de' MMMM", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-3 text-indigo-400 font-bold text-sm">
                  <Users className="w-5 h-5 opacity-40" />
                  {event.totalCards} Cartelas
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="bg-indigo-900 text-white p-2 rounded-lg group-hover:bg-amber-400 group-hover:text-indigo-900 transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}