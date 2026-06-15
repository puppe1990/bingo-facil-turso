import { describe, it, expect } from 'vitest';
import { validateChangePasswordInput } from './change-password';

describe('validateChangePasswordInput', () => {
  it('rejects empty current password', () => {
    const result = validateChangePasswordInput({
      currentPassword: '',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(result).toEqual({ ok: false, error: 'Informe a senha atual.' });
  });

  it('rejects new password shorter than 8 characters', () => {
    const result = validateChangePasswordInput({
      currentPassword: 'oldpassword',
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(result).toEqual({ ok: false, error: 'A nova senha deve ter pelo menos 8 caracteres.' });
  });

  it('rejects when confirmation does not match new password', () => {
    const result = validateChangePasswordInput({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmPassword: 'different123',
    });
    expect(result).toEqual({ ok: false, error: 'As senhas não coincidem.' });
  });

  it('accepts valid input', () => {
    const result = validateChangePasswordInput({
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(result).toEqual({ ok: true });
  });
});
