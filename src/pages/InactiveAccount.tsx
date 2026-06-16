import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, LogOut, Ticket } from 'lucide-react';
import { signOut } from '../lib/auth-client';
import { getUserAccessForSessionFn } from '../server/user-access.functions';
import type { UserAccessSessionView } from '../server/user-access.server';

export function InactiveAccount() {
  const navigate = useNavigate();
  const [access, setAccess] = useState<UserAccessSessionView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserAccessForSessionFn()
      .then((result) => {
        setAccess(result);
        if (result?.canAccess) {
          navigate({ to: '/' });
        }
      })
      .catch(() => setAccess(null))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: '/login' });
  };

  const title =
    access?.effectiveStatus === 'expired'
      ? 'Seu acesso expirou'
      : 'Sua conta ainda não foi ativada';

  const description =
    access?.effectiveStatus === 'expired' && access.accessExpiresAt
      ? `Seu acesso expirou em ${format(access.accessExpiresAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}. Entre em contato com o suporte para renovar.`
      : 'Sua conta foi criada com sucesso, mas ainda aguarda ativação pela equipe. Você será notificado quando o acesso for liberado.';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-yellow-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-[120px] opacity-60" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-[3.5rem] shadow-[0_32px_80px_rgba(30,27,75,0.08)] border-2 border-indigo-50 overflow-hidden">
          <div className="bg-indigo-900 p-12 text-center relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center shadow-2xl mb-6 rotate-3">
                <Ticket className="w-10 h-10 text-indigo-900" />
              </div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                Bingo Master
              </h1>
            </div>
          </div>

          <div className="p-12 text-center">
            {loading ? (
              <p className="text-indigo-400 font-bold">Carregando...</p>
            ) : (
              <>
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-black text-indigo-900 uppercase italic mb-4">
                  {title}
                </h2>
                <p className="text-indigo-400 font-medium mb-8 leading-relaxed">{description}</p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 w-full bg-indigo-100 border-2 border-indigo-200 p-5 rounded-2xl font-black text-indigo-700 hover:bg-indigo-200 transition-all uppercase tracking-widest"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da conta
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
