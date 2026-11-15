import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { BasePage } from './BasePage';

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface ProductsPayload {
  data: Product[];
  total: number;
  current_page?: number;
  per_page?: number;
  last_page?: number;
}

export type SortValue = 'name,asc' | 'name,desc' | 'price,asc' | 'price,desc';

/** True for the GET /products?... call the Angular front end makes to fill the grid. */
function isProductsListResponse(response: Response): boolean {
  return (
    response.request().method() === 'GET' && /\/products(\?|$)/.test(response.url()) && response.ok()
  );
}

/** Home page: product grid, search box, sorting and category filters. */
export class HomePage extends BasePage {
  protected readonly path = '/';

  readonly searchBox: Locator;
  readonly searchButton: Locator;
  readonly searchReset: Locator;
  readonly searchCaption: Locator;
  readonly sortSelect: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly noResults: Locator;

  constructor(page: Page) {
    super(page);
    this.searchBox = page.getByTestId('search-query');
    this.searchButton = page.getByTestId('search-submit');
    this.searchReset = page.getByTestId('search-reset');
    this.searchCaption = page.getByTestId('search-caption');
    this.sortSelect = page.getByTestId('sort');
    this.productCards = page.locator('a.card');
    this.productNames = page.getByTestId('product-name');
    this.productPrices = page.getByTestId('product-price');
    this.noResults = page.getByText(/there are no products found/i);
  }

  override async waitUntilLoaded(): Promise<void> {
    // Cards render before their data arrives, so wait for a name with real text.
    await expect(this.productNames.filter({ hasText: /\S/ }).first()).toBeVisible();
  }

  /** Opens the home page and returns the products payload the API sent for the first page. */
  async openAndGetProducts(): Promise<ProductsPayload> {
    const responsePromise = this.page.waitForResponse(isProductsListResponse);
    await this.page.goto(this.path);
    const payload = (await (await responsePromise).json()) as ProductsPayload;
    await this.waitUntilLoaded();
    return payload;
  }

  /** Searches by name and waits until the grid shows exactly what the API returned. */
  async search(term: string): Promise<ProductsPayload> {
    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/products/search') && r.ok(),
    );
    await this.searchBox.fill(term);
    await this.searchButton.click();
    const payload = (await (await responsePromise).json()) as ProductsPayload;
    await expect(this.searchCaption).toContainText(term);
    await expect(this.productNames).toHaveText(payload.data.map((p) => p.name));
    return payload;
  }

  async resetSearch(): Promise<ProductsPayload> {
    const responsePromise = this.page.waitForResponse(isProductsListResponse);
    await this.searchReset.click();
    return this.gridMatchesResponse(await responsePromise);
  }

  async sortBy(value: SortValue): Promise<ProductsPayload> {
    const responsePromise = this.page.waitForResponse(isProductsListResponse);
    await this.sortSelect.selectOption(value); // <select> dropdown
    return this.gridMatchesResponse(await responsePromise);
  }

  /** Ticks (or unticks) a category checkbox in the sidebar filter. */
  async setCategoryFilter(label: string, checked: boolean): Promise<ProductsPayload> {
    const responsePromise = this.page.waitForResponse(isProductsListResponse);
    await this.page.getByRole('checkbox', { name: label, exact: true }).setChecked(checked);
    return this.gridMatchesResponse(await responsePromise);
  }

  /** Clicks a product card and returns its name and price as shown on the grid. */
  async openProduct(index = 0): Promise<{ name: string; price: string }> {
    const card = this.productCards.nth(index);
    const name = (await card.getByTestId('product-name').innerText()).trim();
    const price = (await card.getByTestId('product-price').innerText()).trim();
    await card.click();
    await expect(this.page).toHaveURL(/\/product\//);
    return { name, price };
  }

  async displayedNames(): Promise<string[]> {
    return (await this.productNames.allInnerTexts()).map((text) => text.trim());
  }

  async displayedPrices(): Promise<string[]> {
    return (await this.productPrices.allInnerTexts()).map((text) => text.trim());
  }

  private async gridMatchesResponse(response: Response): Promise<ProductsPayload> {
    const payload = (await response.json()) as ProductsPayload;
    // Web-first assertion with an array: retries until the grid shows exactly these names.
    await expect(this.productNames).toHaveText(payload.data.map((p) => p.name));
    return payload;
  }
}
