import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage {
  protected readonly path = '/account';

  readonly title: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('page-title');
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account$/);
    await expect(this.title).toBeVisible();
  }
}
