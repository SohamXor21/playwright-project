# Playwright E-Commerce Automation Testing Framework

End-to-end (UI) and API test automation for the **Toolshop** demo shop at
<https://practicesoftwaretesting.com>, built with **Playwright + TypeScript** and a
**Page Object Model** architecture.

## Objectives

- Show practical, industry-style Playwright skills: POM, fixtures, data-driven tests, API testing, reporting, CI.
- Cover the real user journeys of the shop: authentication, registration, products, cart, checkout, contact form.
- Keep tests **independent and repeatable** (unique generated users, no reliance on execution order, no fixed waits).
- Keep secrets out of the code (environment variables / GitHub secrets).

## Technologies

Playwright (`@playwright/test`), TypeScript, Node.js 18+, dotenv, GitHub Actions, VS Code, Git/GitHub.

## What is tested

| Module | Coverage |
|---|---|
| Authentication | valid / invalid / empty login, malformed email, error messages, logout, session persistence after reload, protected page redirect |
| Registration | successful registration + login, empty form, each mandatory field (data-driven), invalid emails, weak passwords, duplicate email |
| Products | listing vs API, name/price format, details page vs list vs API, search (data-driven), no-result search, reset search, sorting (4 options), category filters (checkboxes) |
| Cart | add, quantity on add, line/cart totals, change quantity, remove, empty cart, persistence after reload |
| Checkout | order summary, full checkout (cash on delivery and credit card), mandatory billing fields (data-driven), invalid card details, payment method required |
| Contact | **file upload**, empty form validation |
| API (`APIRequestContext`) | GET products / product / search / sort / brands / categories / 404; POST login (200, 401); GET `/users/me` (200, 401); POST register (201, 422 duplicate, 422 empty); PUT user; DELETE user (admin, optional); cart POST/GET/DELETE |

Playwright concepts used: locator strategies (`getByTestId`, `getByRole`, `getByText`, `getByLabel`-style role queries, `getByPlaceholder`, CSS), `expect()` web-first assertions, auto-waiting, dropdowns (`selectOption`), checkboxes (`setChecked`), file upload (`setInputFiles`), screenshots, traces, hooks (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`), fixtures, POM, data-driven tests, environment variables, API testing, cross-browser projects, parallel execution, HTML reporting.

**Not implemented on purpose** (the site has no such feature, so no artificial tests): browser alerts/dialogs, iframes, multi-tab flows, file download in the tested flows.

## Architecture

```
playwright-ecommerce-framework/
├── tests/                 authentication/ products/ cart/ checkout/ contact/ api/
├── pages/                 BasePage, LoginPage, AccountPage, RegistrationPage, HomePage,
│                          ProductPage, CartPage, CheckoutPage, ContactPage
├── fixtures/test-fixtures.ts   page objects, `api` request context, `loggedInCustomer`
├── test-data/             users.json, products.json, sample-attachment.txt
├── utils/                 test-data-generator.ts, helpers.ts
├── config/environment.ts  environment variables
├── .github/workflows/playwright.yml
├── playwright.config.ts, tsconfig.json, package.json, .env.example
└── playwright-report/, test-results/   (generated, git-ignored)
```

Differences from the requested layout: added `AccountPage.ts` (post-login assertions), `ContactPage.ts` +
`tests/contact/` (the only real file-upload on the site), `sample-attachment.txt`, `tsconfig.json`, and an
`api` Playwright project so API tests run once instead of once per browser.

Design rules: page objects expose `Locator`s and user actions, tests own the assertions; no `waitForTimeout`;
waiting is done through auto-waiting, web-first assertions and `waitForResponse`.

## Setup (Windows PowerShell)

```powershell
cd "C:\Users\91755\Desktop\testing xor"
npm install
npx playwright install --with-deps
Copy-Item .env.example .env
notepad .env        # fill USER_EMAIL and USER_PASSWORD
npm run typecheck
```

The Toolshop login page publishes demo customer accounts for practice - use one of those in `.env`.
`ADMIN_EMAIL` / `ADMIN_PASSWORD` are optional (only the admin DELETE API test uses them; it skips itself if empty).

## Configuration

`playwright.config.ts`: Chromium/Firefox/WebKit + `api` projects, base URL from `BASE_URL`, 60 s test timeout,
10 s expect timeout, screenshot and video on failure, trace on first retry, HTML reporter, fully parallel,
2 retries on CI. `testIdAttribute` is `data-test` because that is what the site uses.

## Running tests

```powershell
npx playwright test                                   # everything (3 browsers + API)
npx playwright test tests/authentication/login.spec.ts
npx playwright test --project=chromium --headed
npx playwright test --project=chromium --debug
npx playwright test --project=firefox
npx playwright test --project=api                     # or: npm run test:api
npx playwright test --project=chromium --trace on     # force traces locally
npx playwright test -g "valid credentials"            # by test title
```

## Reports and debugging

```powershell
npx playwright show-report        # opens playwright-report/index.html
```

The report lists each test with status, duration, error message, screenshot, video and (on retry / `--trace on`)
a trace. Open a failed test -> **Traces** to step through actions, DOM snapshots, network and console.
To inspect a trace file directly: `npx playwright show-trace test-results\<folder>\trace.zip`.
After your first run, save a screenshot of the report in a `docs/` folder and link it here for your manager demo.

## CI (GitHub Actions)

`.github/workflows/playwright.yml` installs dependencies and browsers, type-checks, runs the suite, always uploads
the HTML report, and uploads `test-results/` (screenshots, videos, traces) when tests fail.
Add repository secrets `USER_EMAIL` and `USER_PASSWORD` (and optionally `ADMIN_EMAIL`, `ADMIN_PASSWORD`).
After your first local `npm install`, commit `package-lock.json` and change `npm install` to `npm ci` in the workflow.

## Selector maintenance

Locators are based on the site's `data-test` attributes. If the site changes, update the single line in the
matching page object. Use `npm run codegen` to discover new locators.

## Future enhancements

Reuse login through `storageState`, accessibility checks, visual regression, sharding in CI, Allure reporting,
admin-area tests, invoice PDF download test.
