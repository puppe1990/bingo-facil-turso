import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserAccessStatus } from '../db/types';

export function formatUserAccessLabel(status: UserAccessStatus): string {
  const labels: Record<UserAccessStatus, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    expired: 'Expirado',
  };
  return labels[status];
}

export function getUserAccessBadgeClass(status: UserAccessStatus): string {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status === 'expired') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-indigo-100 text-indigo-500';
}

export function formatAccessValidUntil(
  effectiveStatus: UserAccessStatus,
  accessExpiresAt: Date | null,
): string {
  if (effectiveStatus === 'inactive') {
    return 'Aguardando ativação pelo admin';
  }
  if (accessExpiresAt) {
    return format(accessExpiresAt, 'dd/MM/yyyy', { locale: ptBR });
  }
  return 'Sem data de expiração';
}
