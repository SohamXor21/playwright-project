import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Product details page (/product/<id>). */
export class ProductPage extends BasePage {
  protected readonly path = '/product';

  readonly name: Locator;
  readonly unitPrice: Locator;
  readonly description: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.description = page.getByTestId('product-description');
    this.quantity = page.getByTestId('quantity');
    this.addToCartButton = page.getByTestId('add-to-cart');
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/product\//);
    await expect(this.name).toContainText(/\S/);
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantity.fill(String(quantity));
  }

  /**
   * Adds the product to the cart and waits until the header badge reflects it,
   * so the next action can never race with the pending request.
   */
  async addToCart(quantity = 1): Promise<void> {
    const before = await this.cartCount();
    if (quantity !== 1) {
      await this.setQuantity(quantity);
    }
    await this.addToCartButton.click();
    await expect.poll(() => this.cartCount()).toBe(before + quantity);
  }
}
