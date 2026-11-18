# Wikipedia Interface Language Switch — AQA Test Task

End-to-end automated test verifying that an authorised Wikipedia user can change the interface language in **Special:Preferences** (`Playwright` + `TypeScript`, `Docker`).

---

## Test Case Specification

### TC-01: Authorised user switches the interface language in Preferences

- **Preconditions:**
  1. A registered Wikipedia account exists (`WIKI_USERNAME`, `WIKI_PASSWORD`).
  2. The user is logged in and the current interface language is set to English (`en`).
- **Steps:**
  1. From the Main Page, open the user menu and navigate to **Preferences** (`Special:Preferences`). Verify `<html lang="en">`.
  2. Open the **User profile** tab and verify the **Internationalisation** section is visible.
  3. Select the target interface language (`TARGET_LANGUAGE`, default `uk`) in the **Language** dropdown, click **Save**, and verify the success notification appears and the **Save** button becomes disabled.
  4. Verify the **Preferences** page reloads in the selected language (`<html lang="...">` and the `#firstHeading` text matches MediaWiki's official translation for `preferences`).
  5. Navigate to `/wiki/Main_Page` and verify the interface remains in the selected language (`<html lang="...">`).
  6. Query the MediaWiki Action API (`action=query&meta=userinfo&uiprop=options`) to verify the `language` preference is persisted on the account.
- **Postconditions (Teardown):**
  - The user's `language` preference is reset to `en` via the MediaWiki Action API (`/w/api.php`, `action=options`) so subsequent runs always start from a clean, deterministic state.

---

## Project Structure

```text
├── .auth/                               # Saved session (storageState), created by the setup project, git-ignored
├── fixtures/
│   ├── auth.ts                          # Test accounts (one per worker) and their session file paths
│   └── fixtures.ts                      # Custom Playwright fixtures (credentials, Page Objects, WikiApi, userSession, defLang)
├── pages/
│   ├── BasePage.ts                      # Custom actions (customClick, customFill, navigate) & common assertions
│   ├── LoginPage.ts                     # Special:UserLogin interactions & session assertion
│   ├── MainPage.ts                      # Main_Page navigation & assertions
│   └── PreferencesPage.ts               # Special:Preferences navigation, Codex language select & save
├── tests/
│   ├── auth.setup.ts                    # Setup project: logs in every account via the UI and saves its storageState
│   └── change-interface-language.spec.ts # TC-01 test specification
├── utils/
│   └── WikiApi.ts                       # MediaWiki Action API helper for setup, teardown & i18n messages
├── .env.example                         # Environment variable template
├── Dockerfile                           # Container definition (Node 22 + Playwright Chromium)
├── docker-compose.yml                   # One-command containerised test execution & report volume mounts
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

---

## Key Design Decisions

- **Log in once per account, one account per worker (`storageState`):**
  - The `setup` project (`tests/auth.setup.ts`) loops over the test accounts, logs each one in through the UI once per run and saves its cookies to `.auth/user-<N>.json`.
  - The `chromium` project depends on `setup`; the `storageState` and `credentials` fixtures pick account `N` by the worker's `parallelIndex`, so every test starts already authorised and login is not repeated per test.
  - The test changes a server-side account preference, so parallel workers must not share an account: `workers` equals the number of configured accounts (`WIKI_USERS`, or the single `WIKI_USERNAME` account).
  - The `userSession` fixture checks the restored session via the API (`meta=userinfo`) and fails fast with a clear message if it expired; `defLang` depends on `userSession`, so API setup never runs anonymously.

- **UI for the system under test, API for state & oracles:**
  - The language change itself is performed strictly through the UI (User Menu -> Preferences -> Language combobox -> Save).
  - Precondition setup, teardown (`try ... finally`), and expected localized strings (`action=query&meta=allmessages`) are handled via dedicated on-demand Playwright fixtures (`userSession`, `defLang`) and `WikiApi` sharing the browser context's cookies (`page.request`).
- **No hard-coded translations:**
  - Expected heading text is fetched dynamically from MediaWiki's localization system (`WikiApi.message('preferences', TARGET_LANGUAGE)`), allowing `TARGET_LANGUAGE` to be switched to any valid language code (e.g. `uk`, `de`, `es`, `fr`) without changing test code.
- **Language-independent selectors:**
  - Locators rely on stable MediaWiki IDs (`#pt-preferences`, `#mw-prefsection-personal-i18n`, `#prefcontrol`, `#mw-notification-area`) and ARIA roles (`tab`, `combobox`, `option`) so assertions and cleanup do not break when the UI language changes.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/testomut/wikipedia-language-aqa.git
cd wikipedia-language-aqa
```

---

### 2. Configure Environment Variables (`.env`)

Before running the tests (via Docker or locally), create a `.env` file in the project root from `.env.example` and fill in the required credentials:

```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Open `.env` and set the mandatory variables (`WIKI_USERNAME`, `WIKI_PASSWORD`):

```dotenv
WIKI_USERNAME=your_wikipedia_username
WIKI_PASSWORD=your_wikipedia_password
TARGET_LANGUAGE=uk
WIKI_BASE_URL=https://en.wikipedia.org
```

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `WIKI_USERNAME` | **Yes** | — | Wikipedia account username |
| `WIKI_PASSWORD` | **Yes** | — | Wikipedia account password |
| `WIKI_USERS` | No | — | JSON list of accounts for parallel runs, one per worker (overrides `WIKI_USERNAME` / `WIKI_PASSWORD`) |
| `TARGET_LANGUAGE` | No | `uk` | Target MediaWiki language code (`uk`, `de`, `pl`, etc.) |
| `WIKI_BASE_URL` | No | `https://en.wikipedia.org` | Target MediaWiki instance URL |

> **Important:**
> - `.env` is required by `docker-compose.yml` (`env_file: .env`) and by the Playwright `credentials` fixture. If `WIKI_USERNAME` or `WIKI_PASSWORD` is missing, the test fails immediately with a configuration error.
> - Use a dedicated Wikipedia test account without an attached email address or 2FA so MediaWiki does not request interactive `EmailAuth` verification codes on headless login.

---

### 3. Run the Tests

#### Option A: Running with Docker (Recommended)

Build the image and run the tests in an isolated container:

```bash
npm run docker:build
npm run docker:test
```

Or in a single command via Docker Compose:

```bash
docker compose up --build --exit-code-from tests
```

After container execution finishes, the HTML report and test artifacts are automatically copied/mounted to the host machine:
- HTML report (default path: `./playwright-report/index.html`):
  ```bash
  npm run report
  # or: npx playwright show-report playwright-report
  ```
- Failure artifacts (screenshots, traces): `./test-results/`

---

#### Option B: Running Locally

**Prerequisites:** Node.js `>= 20`

```bash
# 1. Install dependencies
npm install

# 2. Install Chromium browser for Playwright
npx playwright install chromium

# 3. Verify TypeScript types
npm run typecheck

# 4. Run tests (headless)
npm test

# 5. Run tests in headed mode
npm run test:headed

# 6. Open the HTML report (default path: ./playwright-report/index.html)
npm run report
```
