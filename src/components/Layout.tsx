import type { ReactNode } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { signOut, useSession } from '../lib/auth-client';
import { BrandMark } from './BrandMark';
import { LogOut, LayoutDashboard, PlusCircle, Ticket, Users, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function Layout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const { data: session } = useSession();
  const user = session?.user;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: '/login' });
  };

  const isActive = (path: string) => location.pathname === path;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'B';

  return (
    <div className="flex min-h-screen bg-yellow-50 font-sans pb-20 md:pb-0">
      <aside className="hidden md:flex w-64 bg-indigo-800 text-white flex-col fixed inset-y-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <BrandMark className="w-10 h-10" letterClassName="text-xl" />
          <h1 className="text-xl font-black tracking-tight uppercase">Bingo Fácil</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 text-amber-400" />
            Início
          </Link>
          <Link
            to="/create"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/create')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <PlusCircle className="w-5 h-5 text-amber-400" />
            Novo Bingo
          </Link>

          <div className="pt-4 pb-2 px-3 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
            Acesso Rápido
          </div>
          <Link
            to="/"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <Ticket className="w-5 h-5 text-amber-400" />
            Meus Eventos
          </Link>
          <Link
            to="/vendas"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/vendas')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <Users className="w-5 h-5 text-amber-400" />
            Vendas
          </Link>
          <Link
            to="/config"
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              isActive('/config')
                ? 'bg-indigo-700/50 border-l-4 border-amber-400 font-bold'
                : 'hover:bg-indigo-700/30 text-indigo-100'
            }`}
          >
            <Settings className="w-5 h-5 text-amber-400" />
            Ajustes
          </Link>
        </nav>

        <div className="p-6 bg-indigo-900 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-700 bg-amber-400 flex items-center justify-center text-indigo-900 font-black">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate leading-none">{user?.name}</p>
              <p className="text-[10px] text-indigo-300 truncate mt-1">PRO • Ilimitado</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-indigo-800 hover:bg-red-600 px-3 py-2 rounded-lg text-sm font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-indigo-800 border-t border-indigo-700 flex justify-around p-2 z-50">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive('/') ? 'text-amber-400' : 'text-indigo-300'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Início</span>
        </Link>
        <Link
          to="/create"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive('/create') ? 'text-amber-400' : 'text-indigo-300'}`}
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Novo</span>
        </Link>
        <Link
          to="/vendas"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive('/vendas') ? 'text-amber-400' : 'text-indigo-300'}`}
        >
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Vendas</span>
        </Link>
        <Link
          to="/config"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${isActive('/config') ? 'text-amber-400' : 'text-indigo-300'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase">Ajustes</span>
        </Link>
      </nav>

      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
