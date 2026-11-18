import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MainPage } from '../pages/MainPage';
import { PreferencesPage } from '../pages/PreferencesPage';
import { WikiApi } from '../utils/WikiApi';

import { accountFor, authFile, type Credentials } from './auth';

export const DEFAULT_LANGUAGE = 'en';

type Fixtures = {
  credentials: Credentials;
  loginPage: LoginPage;
  mainPage: MainPage;
  preferencesPage: PreferencesPage;
  wikiApi: WikiApi;
  userSession: string;
  defLang: string;
};

export const test = base.extend<Fixtures>({
  // One account per worker: the worker with parallelIndex N uses account N and its saved session.
  credentials: async ({ }, use, testInfo) => {
    await use(accountFor(testInfo.parallelIndex));
  },
  storageState: async ({ }, use, testInfo) => {
    await use(authFile(testInfo.parallelIndex));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  mainPage: async ({ page }, use) => {
    await use(new MainPage(page));
  },
  preferencesPage: async ({ page }, use) => {
    await use(new PreferencesPage(page));
  },
  wikiApi: async ({ page }, use) => {
    await use(new WikiApi(page.request));
  },
  userSession: async ({ wikiApi, credentials }, use) => {
    await test.step(
      `Precondition: session of "${credentials.username}" is restored from storageState`,
      async () => {
        await wikiApi.expectLoggedInAs(credentials.username);
      },
    );

    await use(credentials.username);
  },
  defLang: async ({ wikiApi, userSession }, use) => {
    try {
      await test.step(
        `Precondition: reset interface language of "${userSession}" to "${DEFAULT_LANGUAGE}" via API`,
        async () => {
          await wikiApi.setOption('language', DEFAULT_LANGUAGE);
        },
      );

      await use(DEFAULT_LANGUAGE);
    } finally {
      await test.step(
        `Teardown: restore interface language to "${DEFAULT_LANGUAGE}" via API`,
        async () => {
          await wikiApi.setOption('language', DEFAULT_LANGUAGE).catch(() => undefined);
        },
      );
    }
  },
});

const originalStep = test.step.bind(test);
test.step = ((
  title: string,
  body: () => Promise<unknown>,
  options?: { box?: boolean; timeout?: number },
) => {
  console.log(`[STEP] Starting: ${title}`);
  return originalStep(title, body, options);
}) as typeof test.step;

export { expect } from '@playwright/test';


