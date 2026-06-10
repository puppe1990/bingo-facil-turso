import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Ticket } from 'lucide-react';
import { signUp, useSession } from '@/src/lib/auth-client';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      navigate({ to: '/' });
    }
  }, [session, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError('Não foi possível criar a conta. Verifique os dados.');
        setLoading(false);
      }
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-yellow-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-[120px] opacity-60" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-[3.5rem] shadow-[0_32px_80px_rgba(30,27,75,0.08)] border-2 border-indigo-50 overflow-hidden">
          <div className="bg-indigo-900 p-12 text-center relative">
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-amber-400 rounded-3xl flex items-center justify-center shadow-2xl mb-6">
                <Ticket className="w-10 h-10 text-indigo-900" />
              </div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-2">Criar Conta</h1>
              <p className="text-indigo-300 font-bold uppercase tracking-[0.2em] text-[10px]">Bingo Fácil</p>
            </div>
          </div>

          <div className="p-12">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border-2 border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Senha</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-indigo-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl font-bold text-indigo-900 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-400 border-2 border-amber-500 p-5 rounded-2xl font-black text-indigo-900 shadow-sm hover:bg-amber-300 transition-all disabled:opacity-50 uppercase tracking-widest"
              >
                {loading ? 'Criando...' : 'Criar Conta'}
              </button>
            </form>

            <p className="mt-8 text-center text-indigo-400 text-sm font-bold">
              Já tem conta?{' '}
              <Link to="/login" className="text-indigo-600 hover:underline font-black">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}