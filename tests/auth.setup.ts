import { test as setup } from '../fixtures/fixtures';
import { CONFIG_ERROR, authFile, loadAccounts } from '../fixtures/auth';

const accounts = loadAccounts();

// Setup always starts logged out, whatever storageState the fixtures would pick.
setup.use({ storageState: { cookies: [], origins: [] } });

if (accounts.length === 0) {
  setup('Test accounts are configured', () => {
    throw new Error(CONFIG_ERROR);
  });
}

for (const [index, account] of accounts.entries()) {
  setup(`Log in account #${index} and save the session to storageState`, async ({ page, loginPage }) => {
    await setup.step(`Log in as "${account.username}" via the UI`, async () => {
      await loginPage.open();
      await loginPage.login(account.username, account.password);
      await loginPage.expectLoggedInAs(account.username);
    });

    await setup.step(`Save cookies and storage to ${authFile(index)}`, async () => {
      await page.context().storageState({ path: authFile(index) });
    });
  });
}
