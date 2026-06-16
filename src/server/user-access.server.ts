import { eq } from 'drizzle-orm';
import { resolveUserAccess } from '../../shared/user-access';
import type { AppDatabase } from '../lib/db/index';
import { user } from '../lib/db/schema';
import type { UserAccessStatus } from '../lib/db/types';

export class UserAccessDeniedError extends Error {
  constructor(public readonly status: UserAccessStatus) {
    super('User access denied');
    this.name = 'UserAccessDeniedError';
  }
}

export type UserAccessSessionView = {
  isActive: boolean;
  accessExpiresAt: Date | null;
  effectiveStatus: UserAccessStatus;
  canAccess: boolean;
};

export async function getUserAccessForSession(
  db: AppDatabase,
  userId: string,
  now: Date = new Date(),
): Promise<UserAccessSessionView> {
  const rows = await db
    .select({
      isActive: user.isActive,
      accessExpiresAt: user.accessExpiresAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error('User not found');
  }

  const row = rows[0]!;
  const resolved = resolveUserAccess(
    { isActive: row.isActive, accessExpiresAt: row.accessExpiresAt },
    now,
  );

  return {
    isActive: row.isActive,
    accessExpiresAt: row.accessExpiresAt,
    ...resolved,
  };
}

export async function assertUserCanAccess(
  db: AppDatabase,
  userId: string,
  now: Date = new Date(),
): Promise<UserAccessSessionView> {
  const access = await getUserAccessForSession(db, userId, now);
  if (!access.canAccess) {
    throw new UserAccessDeniedError(access.effectiveStatus);
  }
  return access;
}
