import { APIRequestContext, expect } from '@playwright/test';

export class WikiApi {
  constructor(private readonly request: APIRequestContext) {}

  private async csrfToken(): Promise<string> {
    const response = await this.request.get('/w/api.php', {
      params: { action: 'query', meta: 'tokens', type: 'csrf', format: 'json' },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const token: string | undefined = body?.query?.tokens?.csrftoken;
    expect(token, 'CSRF token for a logged-in session').toBeTruthy();
    expect(token).not.toBe('+\\');
    return token as string;
  }

  async setOption(name: string, value: string): Promise<void> {
    const token = await this.csrfToken();
    const response = await this.request.post('/w/api.php', {
      form: { action: 'options', optionname: name, optionvalue: value, token, format: 'json' },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body?.options, `action=options result: ${JSON.stringify(body)}`).toBe('success');
  }

  async expectLoggedInAs(username: string): Promise<void> {
    const response = await this.request.get('/w/api.php', {
      params: { action: 'query', meta: 'userinfo', format: 'json' },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(
      body?.query?.userinfo?.name,
      'Session from storageState is logged in (anonymous means the saved session expired)',
    ).toBe(username);
  }

  async getOption(name: string): Promise<string | undefined> {
    const response = await this.request.get('/w/api.php', {
      params: { action: 'query', meta: 'userinfo', uiprop: 'options', format: 'json' },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    return body?.query?.userinfo?.options?.[name];
  }

  async expectOption(name: string, expectedValue: string): Promise<void> {
    const actualValue = await this.getOption(name);
    expect(actualValue).toBe(expectedValue);
  }

  async message(key: string, lang: string): Promise<string> {
    const response = await this.request.get('/w/api.php', {
      params: {
        action: 'query',
        meta: 'allmessages',
        ammessages: key,
        amlang: lang,
        format: 'json',
        formatversion: '2',
      },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const text: string | undefined = body?.query?.allmessages?.[0]?.content;
    expect(text, `message "${key}" in "${lang}"`).toBeTruthy();
    return text as string;
  }
}

