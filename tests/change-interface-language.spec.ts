import { test } from '../fixtures/fixtures';

const TARGET_LANGUAGE = process.env.TARGET_LANGUAGE || 'uk';

test.describe('Preferences: interface language', () => {
  test(`TC-01: authorised user switches the interface language to "${TARGET_LANGUAGE}"`, async ({
    userSession,
    defLang,
    mainPage,
    preferencesPage,
    wikiApi,
  }) => {
    const expectedHeading = await wikiApi.message('preferences', TARGET_LANGUAGE);

    await test.step('1. Open Preferences from the user menu', async () => {
      await mainPage.open();
      await mainPage.expectLoggedInAs(userSession);
      await preferencesPage.openFromUserMenu();
      await preferencesPage.expectInterfaceLanguage(defLang);
    });

    await test.step('2. Open the "User profile" tab', async () => {
      await preferencesPage.openUserProfileTab();
    });

    await test.step(`3. In "Internationalisation" select "${TARGET_LANGUAGE}" and save`, async () => {
      await preferencesPage.selectInterfaceLanguage(TARGET_LANGUAGE);
      await preferencesPage.save();
    });

    await test.step('4. The Preferences page is shown in the selected language', async () => {
      await preferencesPage.expectInterfaceLanguage(TARGET_LANGUAGE);
      await preferencesPage.expectHeading(expectedHeading);
    });

    await test.step('5. Other pages are shown in the selected language', async () => {
      await mainPage.open();
      await mainPage.expectInterfaceLanguage(TARGET_LANGUAGE);
    });

    await test.step('6. The preference is stored for the account', async () => {
      await wikiApi.expectOption('language', TARGET_LANGUAGE);
    });
  });
});
