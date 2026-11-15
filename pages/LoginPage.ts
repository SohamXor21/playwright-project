import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export interface Credentials {
  email: string;
  password: string;
}

export class LoginPage extends BasePage {
  protected readonly path = '/auth/login';

  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-submit');
    this.error = page.getByTestId('login-error');
    this.emailError = page.getByTestId('email-error');
    this.passwordError = page.getByTestId('password-error');
    this.registerLink = page.getByTestId('register-link');
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.email).toBeVisible();
  }

  /** Performs the login action only; the test decides what the outcome should be. */
  async login({ email, password }: Credentials): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  /** Logs in and waits until the account page is shown. */
  async loginSuccessfully(credentials: Credentials): Promise<void> {
    await this.login(credentials);
    await expect(this.page).toHaveURL(/\/account$/);
  }
}
