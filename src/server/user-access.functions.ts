import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { getAuth } from '../lib/auth.server';
import { getDb, getDbReady } from '../lib/db/index';
import { getUserAccessForSession } from './user-access.server';

export const getUserAccessForSessionFn = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session?.user) {
    return null;
  }
  await getDbReady();
  return getUserAccessForSession(getDb(), session.user.id);
});

export const assertUserCanAccessFn = createServerFn({ method: 'GET' }).handler(async () => {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session?.user) {
    return { ok: false as const, status: null };
  }
  await getDbReady();
  const access = await getUserAccessForSession(getDb(), session.user.id);
  if (!access.canAccess) {
    return { ok: false as const, status: access.effectiveStatus };
  }
  return { ok: true as const, access };
});
