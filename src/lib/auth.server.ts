import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { getDb, getDbReady } from './db/index';
import * as schema from './db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authInstance: any = null;

export async function getAuth() {
  if (!authInstance) {
    await getDbReady();
    const db = getDb();
    authInstance = betterAuth({
      database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema: {
          user: schema.user,
          session: schema.session,
          account: schema.account,
          verification: schema.verification,
        },
      }),
      baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      basePath: '/api/auth',
      secret: process.env.BETTER_AUTH_SECRET,
      emailAndPassword: {
        enabled: true,
        autoSignIn: true,
      },
      trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
      plugins: [tanstackStartCookies()],
    });
  }
  return authInstance;
}

export function resetAuthForTests(): void {
  authInstance = null;
}