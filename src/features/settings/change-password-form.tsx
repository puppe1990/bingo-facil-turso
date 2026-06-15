import { useState, type FormEvent } from 'react';
import { PasswordInput } from '@/src/components/PasswordInput';
import { changePassword } from '@/src/lib/auth-client';
import { validateChangePasswordInput } from '@/src/lib/change-password';

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validation = validateChangePasswordInput({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setError('Senha atual incorreta. Tente novamente.');
        setLoading(false);
        return;
      }

      setSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    } catch {
      setError('Não foi possível alterar a senha. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border-2 border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-sm font-bold border-2 border-green-100">
          {success}
        </div>
      )}

      <div>
        <label
          htmlFor="current-password"
          className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1"
        >
          Senha Atual
        </label>
        <PasswordInput
          id="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="new-password"
          className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1"
        >
          Nova Senha
        </label>
        <PasswordInput
          id="new-password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1"
        >
          Confirmar Nova Senha
        </label>
        <PasswordInput
          id="confirm-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-lg shadow-indigo-900/10 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Trocar Senha'}
        </button>
      </div>
    </form>
  );
}
