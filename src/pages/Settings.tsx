import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, User, Shield, CreditCard, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSession } from '../lib/auth-client';
import { ChangePasswordForm } from '../features/settings/change-password-form';
import { getUserSubscriptionFn } from '../server/subscriptions.functions';
import { getUserAccessForSessionFn } from '../server/user-access.functions';
import { formatStatusLabel } from '../lib/ui/subscription-badges';
import {
  formatAccessValidUntil,
  formatUserAccessLabel,
  getUserAccessBadgeClass,
} from '../lib/ui/user-access-badges';
import type { UserAccessSessionView } from '../server/user-access.server';

type SettingsTab = 'perfil' | 'seguranca' | 'assinatura';

type UserSubscription = Awaited<ReturnType<typeof getUserSubscriptionFn>>;

const NAV_ITEMS: { id: SettingsTab; icon: typeof User; label: string }[] = [
  { id: 'perfil', icon: User, label: 'Perfil' },
  { id: 'seguranca', icon: Shield, label: 'Segurança' },
  { id: 'assinatura', icon: CreditCard, label: 'Assinatura' },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');
  const [subscription, setSubscription] = useState<UserSubscription>(null);
  const [userAccess, setUserAccess] = useState<UserAccessSessionView | null>(null);
  const { data: session } = useSession();
  const user = session?.user;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  useEffect(() => {
    getUserSubscriptionFn()
      .then(setSubscription)
      .catch(() => setSubscription(null));
    getUserAccessForSessionFn()
      .then(setUserAccess)
      .catch(() => setUserAccess(null));
  }, []);

  const subscriptionStatusLabel = subscription
    ? formatStatusLabel(subscription.effectiveStatus)
    : 'Inativa';
  const accessStatusLabel = userAccess
    ? formatUserAccessLabel(userAccess.effectiveStatus)
    : 'Indisponível';
  const accessValidUntil = userAccess
    ? formatAccessValidUntil(userAccess.effectiveStatus, userAccess.accessExpiresAt)
    : '—';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-4xl font-black text-indigo-900 tracking-tight flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-amber-500" />
          Ajustes
        </h1>
        <p className="text-indigo-400 font-medium mt-2">
          Gerencie sua conta e preferências do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'
                    : 'text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeTab === 'perfil' && (
            <>
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-sm">
                <h2 className="text-xl font-black text-indigo-900 uppercase italic mb-6">
                  Informações do Perfil
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl border-4 border-indigo-50 bg-amber-400 flex items-center justify-center text-indigo-900 font-black text-3xl">
                      {userInitial}
                    </div>
                    <div>
                      <p className="font-black text-indigo-900 text-lg leading-none mb-1">
                        {user?.name}
                      </p>
                      <p className="text-indigo-400 font-medium text-sm">{user?.email}</p>
                      {userAccess && (
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getUserAccessBadgeClass(userAccess.effectiveStatus)}`}
                        >
                          {accessStatusLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">
                        E-mail de Contato
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={user?.email || ''}
                        className="w-full bg-indigo-50/50 border-2 border-indigo-50 rounded-2xl px-6 py-4 font-bold text-indigo-900 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {subscription?.effectiveStatus === 'active' && userAccess?.canAccess && (
                <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-100 relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-amber-200/20 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <h3 className="text-lg font-black text-amber-900 flex items-center gap-2 mb-2">
                      Suporte Premium Ativo
                    </h3>
                    <p className="text-amber-800/70 font-medium text-sm leading-relaxed mb-6">
                      Você tem acesso prioritário ao nosso time de suporte.
                    </p>
                    <button className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all">
                      Acessar Central de Ajuda <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'seguranca' && (
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-sm">
              <h2 className="text-xl font-black text-indigo-900 uppercase italic mb-2">
                Segurança da Conta
              </h2>
              <p className="text-indigo-400 font-medium text-sm mb-6">
                Atualize sua senha para manter sua conta protegida.
              </p>
              <ChangePasswordForm />
            </div>
          )}

          {activeTab === 'assinatura' && (
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-sm space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-black text-indigo-900 uppercase italic">
                  Acesso à plataforma
                </h2>
                {userAccess ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                      <span className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest">
                        Status
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getUserAccessBadgeClass(userAccess.effectiveStatus)}`}
                      >
                        {accessStatusLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                      <span className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest">
                        Válido até
                      </span>
                      <span className="font-black text-indigo-900 text-right max-w-[60%]">
                        {accessValidUntil}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-indigo-400 font-bold">
                    Não foi possível carregar o status de acesso.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-black text-indigo-900 uppercase italic">
                  Sua Assinatura
                </h2>

                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                      <span className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest">
                        Status da assinatura
                      </span>
                      <span className="font-black text-indigo-900">{subscriptionStatusLabel}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                      <span className="font-bold text-indigo-400 uppercase text-[10px] tracking-widest">
                        Expira em
                      </span>
                      <span className="font-black text-indigo-900">
                        {format(subscription.expiresAt, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-indigo-400 font-bold">
                    Você ainda não possui uma assinatura ativa.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
