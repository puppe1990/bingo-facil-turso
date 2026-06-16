import { desc, eq } from 'drizzle-orm';
import type { AppDatabase } from '../lib/db/index';
import { subscriptions } from '../lib/db/schema';
import type { SubscriptionPlan, SubscriptionStatus } from '../lib/db/types';

export function resolveSubscriptionStatus(
  status: SubscriptionStatus,
  expiresAt: Date,
  now: Date = new Date(),
): SubscriptionStatus {
  if (status === 'active' && expiresAt < now) {
    return 'expired';
  }
  return status;
}

export async function getUserSubscription(db: AppDatabase, userId: string, now: Date = new Date()) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.expiresAt))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0]!;
  return {
    plan: row.plan as SubscriptionPlan,
    status: row.status as SubscriptionStatus,
    effectiveStatus: resolveSubscriptionStatus(
      row.status as SubscriptionStatus,
      row.expiresAt,
      now,
    ),
    expiresAt: row.expiresAt,
  };
}
