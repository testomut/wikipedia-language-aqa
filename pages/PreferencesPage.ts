import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PreferencesPage extends BasePage {
  readonly pageUrl = '/wiki/Special:Preferences';
  readonly userProfileTab: Locator;
  readonly internationalisationSection: Locator;
  readonly languageInput: Locator;
  readonly languageOption: (code: string) => Locator;
  readonly saveButton: Locator;
  readonly saveSuccessNotification: Locator;

  constructor(page: Page) {
    super(page);
    this.userProfileTab = page.getByRole('tab', { name: 'User profile' });
    this.internationalisationSection = page.locator('#mw-prefsection-personal-i18n');
    // Until MediaWiki JS upgrades it, the field is a hidden native <select> with the same role: take the visible widget only.
    this.languageInput = this.internationalisationSection.getByRole('combobox').filter({ visible: true });
    this.languageOption = (code: string) =>
      page.getByRole('option', { name: new RegExp(`^${code}\\s+[·-]\\s+`) }).first();
    this.saveButton = page.locator('button#prefcontrol, #prefcontrol button');
    this.saveSuccessNotification = page
      .locator('#mw-notification-area .mw-notification, #mw-preferences-success')
      .first();
  }

  async openFromUserMenu(): Promise<void> {
    await this.customClick(this.userMenuToggle);
    await this.customClick(this.preferencesLink);
    await this.expectUrl(/Special:Preferences/);
  }

  async openUserProfileTab(): Promise<void> {
    await this.customClick(this.userProfileTab);
    await this.expectAttribute(this.userProfileTab, 'aria-selected', 'true');
    await this.expectVisible(this.internationalisationSection);
  }

  async selectInterfaceLanguage(code: string): Promise<void> {
    await this.customClick(this.languageInput);
    await this.languageInput.clear();
    await this.customFill(this.languageInput, code);
    await this.customClick(this.languageOption(code));
  }

  async save(): Promise<void> {
    await this.customClick(this.saveButton);
    await this.expectVisible(this.saveSuccessNotification);
    await this.expectDisabled(this.saveButton);
  }
}
