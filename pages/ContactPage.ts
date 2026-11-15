import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Contact form - the only place on the site with a file upload. */
export class ContactPage extends BasePage {
  protected readonly path = '/contact';

  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly subject: Locator;
  readonly message: Locator;
  readonly attachment: Locator;
  readonly submit: Locator;
  readonly successAlert: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.email = page.getByTestId('email');
    this.subject = page.getByTestId('subject');
    this.message = page.getByTestId('message');
    this.attachment = page.getByTestId('attachment');
    this.submit = page.getByTestId('contact-submit');
    this.successAlert = page.getByRole('alert').filter({ hasText: /thanks for your message/i });
    this.validationErrors = page.locator('[data-test$="-error"]');
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.message).toBeVisible();
  }

  async fillForm(details: { firstName: string; lastName: string; email: string; message: string }): Promise<void> {
    await this.firstName.fill(details.firstName);
    await this.lastName.fill(details.lastName);
    await this.email.fill(details.email);
    await this.subject.selectOption({ index: 1 }); // first real subject (index 0 is the placeholder)
    await this.message.fill(details.message);
  }

  async attachFile(filePath: string): Promise<void> {
    await this.attachment.setInputFiles(filePath);
  }
}
