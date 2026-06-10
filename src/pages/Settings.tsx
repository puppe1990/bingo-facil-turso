import { Settings as SettingsIcon, User, Shield, Bell, CreditCard, ExternalLink } from 'lucide-react';
import { useSession } from '../lib/auth-client';

export function Settings() {
  const { data: session } = useSession();
  const user = session?.user;
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-4xl font-black text-indigo-900 tracking-tight flex items-center gap-4">
          <SettingsIcon className="w-10 h-10 text-amber-500" />
          Ajustes
        </h1>
        <p className="text-indigo-400 font-medium mt-2">Gerencie sua conta e preferências do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <nav className="flex flex-col gap-2">
            {[
              { icon: User, label: 'Perfil', active: true },
              { icon: Shield, label: 'Segurança' },
              { icon: Bell, label: 'Notificações' },
              { icon: CreditCard, label: 'Assinatura' },
            ].map((item, idx) => (
              <button
                key={idx}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
                  item.active
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
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-sm">
            <h2 className="text-xl font-black text-indigo-900 uppercase italic mb-6">Informações do Perfil</h2>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl border-4 border-indigo-50 bg-amber-400 flex items-center justify-center text-indigo-900 font-black text-3xl">
                  {userInitial}
                </div>
                <div>
                  <p className="font-black text-indigo-900 text-lg leading-none mb-1">{user?.name}</p>
                  <p className="text-indigo-400 font-medium text-sm">{user?.email}</p>
                  <span className="inline-block mt-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Conta Pro Platinium</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">E-mail de Contato</label>
                  <input
                    type="text"
                    readOnly
                    value={user?.email || ''}
                    className="w-full bg-indigo-50/50 border-2 border-indigo-50 rounded-2xl px-6 py-4 font-bold text-indigo-900 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button className="bg-indigo-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-900/10">
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-100 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-amber-200/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-lg font-black text-amber-900 flex items-center gap-2 mb-2">
                Suporte Premium Ativo
              </h3>
              <p className="text-amber-800/70 font-medium text-sm leading-relaxed mb-6">
                Como usuário Pro, você tem acesso prioritário ao nosso time de suporte via WhatsApp e E-mail.
              </p>
              <button className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all">
                Acessar Central de Ajuda <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}