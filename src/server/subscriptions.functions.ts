import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getAuth } from '../lib/auth.server';
import { getDb, getDbReady } from '../lib/db/index';
import { getUserSubscription } from './subscriptions.server';

export const getUserSubscriptionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session?.user) {
    return null;
  }
  await getDbReady();
  const db = getDb();
  return getUserSubscription(db, session.user.id);
});
