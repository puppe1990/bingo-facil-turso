import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { resetAuthForTests, getAuth } from '../lib/auth.server';
import { getDbReady, resetDbForTests } from '../lib/db/index';
import { createTestDb, destroyTestDb } from './db';

function sessionHeadersFromSignIn(signIn: { headers?: HeadersInit }) {
  const responseHeaders = new Headers(signIn.headers);
  const setCookie = responseHeaders.get('set-cookie');
  const sessionCookie = setCookie?.split(';')[0];
  return new Headers(sessionCookie ? { cookie: sessionCookie } : undefined);
}

describe('changePassword auth integration', () => {
  let client: Client;
  let dbPath: string;

  beforeEach(async () => {
    const testDb = await createTestDb();
    client = testDb.client;
    dbPath = testDb.dbPath;
    process.env.TURSO_DATABASE_URL = `file:${dbPath}`;
    resetDbForTests();
    resetAuthForTests();
    await getDbReady();
  });

  afterEach(() => {
    resetAuthForTests();
    resetDbForTests();
    destroyTestDb(client, dbPath);
  });

  it('changes password when current password is correct', async () => {
    const email = `user-${crypto.randomUUID()}@bingo.test`;
    const oldPassword = 'oldpassword123';
    const newPassword = 'newpassword456';
    const auth = await getAuth();

    await auth.api.signUpEmail({
      body: { name: 'Test User', email, password: oldPassword },
    });

    const signIn = await auth.api.signInEmail({
      body: { email, password: oldPassword },
      returnHeaders: true,
    });

    const headers = sessionHeadersFromSignIn(signIn);

    const result = await auth.api.changePassword({
      body: {
        currentPassword: oldPassword,
        newPassword,
      },
      headers,
    });

    expect(result).toBeTruthy();

    await expect(
      auth.api.signInEmail({
        body: { email, password: oldPassword },
      }),
    ).rejects.toThrow();

    const newSignIn = await auth.api.signInEmail({
      body: { email, password: newPassword },
    });
    expect(newSignIn.user?.email).toBe(email);
  });

  it('rejects change when current password is wrong', async () => {
    const email = `user-${crypto.randomUUID()}@bingo.test`;
    const password = 'correctpass123';
    const auth = await getAuth();

    await auth.api.signUpEmail({
      body: { name: 'Test User', email, password },
    });

    const signIn = await auth.api.signInEmail({
      body: { email, password },
      returnHeaders: true,
    });

    const headers = sessionHeadersFromSignIn(signIn);

    await expect(
      auth.api.changePassword({
        body: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
        },
        headers,
      }),
    ).rejects.toThrow();
  });
});
