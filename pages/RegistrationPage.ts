import { expect, type Locator, type Page } from '@playwright/test';
import type { UserData } from '../utils/test-data-generator';
import { BasePage } from './BasePage';

export class RegistrationPage extends BasePage {
  protected readonly path = '/auth/register';

  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly dob: Locator;
  readonly street: Locator;
  readonly postalCode: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly country: Locator;
  readonly phone: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  /** Every validation message on the form has a data-test ending in "-error". */
  readonly validationErrors: Locator;
  readonly duplicateEmailError: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.dob = page.getByTestId('dob');
    this.street = page.getByTestId('street');
    this.postalCode = page.getByTestId('postal_code');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.country = page.getByTestId('country');
    this.phone = page.getByTestId('phone');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('register-submit');
    this.validationErrors = page.locator('[data-test$="-error"]');
    this.duplicateEmailError = page.getByText(/already exists/i);
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.firstName).toBeVisible();
  }

  fieldError(field: string): Locator {
    return this.page.getByTestId(`${field}-error`);
  }

  async fillForm(user: UserData): Promise<void> {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.dob.fill(user.dob);
    await this.street.fill(user.street);
    await this.postalCode.fill(user.postalCode);
    await this.city.fill(user.city);
    await this.state.fill(user.state);
    await this.country.selectOption(user.country); // <select> dropdown
    await this.phone.fill(user.phone);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
  }

  async register(user: UserData): Promise<void> {
    await this.fillForm(user);
    await this.submit.click();
  }
}
