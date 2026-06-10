import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, Search, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { listSoldCardsFn } from '../server/events.functions';

interface SoldCard {
  id: string;
  cardNumber: string;
  buyerName: string | null;
  buyerPhone?: string | null;
  updatedAt: Date | null;
  eventId: string;
}

export function Vendas() {
  const [vendas, setVendas] = useState<SoldCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchVendas() {
      try {
        const results = await listSoldCardsFn();
        setVendas(results as SoldCard[]);
      } catch (error) {
        console.error('Failed to load sales', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVendas();
  }, []);

  const filteredVendas = vendas.filter(v =>
    v.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
    (v.buyerPhone && v.buyerPhone.includes(search)) ||
    v.cardNumber.toString().includes(search)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-indigo-900 tracking-tight flex items-center gap-4">
            <Users className="w-10 h-10 text-amber-500" />
            Histórico de Vendas
          </h1>
          <p className="text-indigo-400 font-medium mt-2">Veja todas as cartelas vendidas em seus eventos</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por comprador ou nº..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border-2 border-indigo-50 rounded-2xl w-full md:w-80 shadow-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-indigo-900 placeholder:text-indigo-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_rgba(30,27,75,0.04)] border-2 border-indigo-50 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Carregando Vendas...</p>
          </div>
        ) : filteredVendas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Cartela</th>
                  <th className="px-8 py-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Comprador</th>
                  <th className="px-8 py-6 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Data/Hora</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-indigo-300 uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50">
                {filteredVendas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black text-sm">
                          #{venda.cardNumber.toString().padStart(3, '0')}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-indigo-900">{venda.buyerName}</p>
                      {venda.buyerPhone && <p className="text-xs text-indigo-400 font-bold">{venda.buyerPhone}</p>}
                    </td>
                    <td className="px-8 py-6 text-indigo-400 font-medium">
                      {venda.updatedAt ? format(new Date(venda.updatedAt), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Pendente'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        to="/event/$eventId"
                        params={{ eventId: venda.eventId }}
                        className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all group-hover:translate-x-[-4px]"
                      >
                        Ver Evento <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-indigo-200" />
            </div>
            <h3 className="text-xl font-bold text-indigo-900 mb-2">Nenhuma venda encontrada</h3>
            <p className="text-indigo-400">Suas vendas aparecerão aqui assim que você registrar cartelas.</p>
          </div>
        )}
      </div>
    </div>
  );
}