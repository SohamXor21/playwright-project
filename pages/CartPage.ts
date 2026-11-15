import { expect, type Locator, type Page } from '@playwright/test';
import { escapeRegExp, parsePrice, sum } from '../utils/helpers';
import { BasePage } from './BasePage';


export class CartPage extends BasePage {
  protected readonly path = '/checkout';

  readonly rows: Locator;
  readonly cartTotal: Locator;
  readonly emptyMessage: Locator;
  readonly proceedButton: Locator;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator('table tbody tr');
    this.cartTotal = page.getByTestId('cart-total');
    this.emptyMessage = page.getByText(/cart is empty/i);
    this.proceedButton = page.getByTestId('proceed-1');
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout/);
    await expect(this.rows.first().or(this.emptyMessage)).toBeVisible();
  }

  row(productName: string): Locator {
    return this.rows.filter({ hasText: new RegExp(escapeRegExp(productName)) });
  }

  quantityInput(productName: string): Locator {
    return this.row(productName).getByTestId('product-quantity');
  }

  linePrice(productName: string): Locator {
    return this.row(productName).getByTestId('line-price');
  }

  unitPrice(productName: string): Locator {
    return this.row(productName).getByTestId('product-price');
  }

 
  private deleteButton(productName: string): Locator {
    const row = this.row(productName);
    return row.getByTestId('delete').or(row.locator('.btn-danger')).first();
  }

  async setQuantity(productName: string, quantity: number): Promise<void> {
    const input = this.quantityInput(productName);
    await input.fill(String(quantity));
    await input.blur(); 
  }

  async removeProduct(productName: string): Promise<void> {
    await this.deleteButton(productName).click();
    await expect(this.row(productName)).toHaveCount(0);
  }

  async lineTotals(): Promise<number[]> {
    const texts = await this.rows.getByTestId('line-price').allInnerTexts();
    return texts.map(parsePrice);
  }

  async displayedTotal(): Promise<number> {
    return parsePrice(await this.cartTotal.innerText());
  }

  /** Cart total must equal the sum of every line total shown in the table. */
  async expectTotalMatchesLines(): Promise<void> {
    await expect
      .poll(async () => (await this.displayedTotal()) === sum(await this.lineTotals()), {
        message: 'cart total should equal the sum of all line totals',
      })
      .toBe(true);
  }
}
