export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordValidationResult = { ok: true } | { ok: false; error: string };

const MIN_PASSWORD_LENGTH = 8;

export function validateChangePasswordInput(
  input: ChangePasswordInput,
): ChangePasswordValidationResult {
  if (!input.currentPassword.trim()) {
    return { ok: false, error: 'Informe a senha atual.' };
  }

  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 8 caracteres.' };
  }

  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: 'As senhas não coincidem.' };
  }

  return { ok: true };
}
