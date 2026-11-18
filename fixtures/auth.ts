export type Credentials = { username: string; password: string };

const CONFIG_ERROR =
  'Set WIKI_USERS (JSON list of {"username","password"}) or WIKI_USERNAME and WIKI_PASSWORD (see .env.example).';

/** Saved session (storageState) of the account with this index. */
export const authFile = (index: number): string => `.auth/user-${index}.json`;

/**
 * Test accounts, one per worker: WIKI_USERS if set, otherwise the single WIKI_USERNAME / WIKI_PASSWORD account.
 * Returns an empty list when nothing is configured, so the config can still be loaded.
 */
export function loadAccounts(): Credentials[] {
  if (process.env.WIKI_USERS) {
    const accounts = JSON.parse(process.env.WIKI_USERS) as Credentials[];
    if (!Array.isArray(accounts) || accounts.some((a) => !a?.username || !a?.password)) {
      throw new Error(`WIKI_USERS is invalid. ${CONFIG_ERROR}`);
    }
    return accounts;
  }

  const { WIKI_USERNAME: username, WIKI_PASSWORD: password } = process.env;
  return username && password ? [{ username, password }] : [];
}

/** Account owned by the worker with this parallelIndex. */
export function accountFor(index: number): Credentials {
  const account = loadAccounts()[index];
  if (!account) {
    throw new Error(`No test account for worker #${index}. ${CONFIG_ERROR}`);
  }
  return account;
}

export { CONFIG_ERROR };
