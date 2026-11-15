import { expect, test } from '../../fixtures/test-fixtures';
import products from '../../test-data/products.json';
import { attachScreenshot, compareText, isSorted, parsePrice } from '../../utils/helpers';
import type { SortValue } from '../../pages/HomePage';

test.describe('Products - listing, details and sorting', () => {
  test('home page lists the same products the API returns', async ({ homePage, page }, testInfo) => {
    const payload = await homePage.openAndGetProducts();
    expect(payload.data.length).toBeGreaterThan(0);
    await expect(homePage.productCards).toHaveCount(payload.data.length);
    await expect(homePage.productNames).toHaveText(payload.data.map((p) => p.name));
    await attachScreenshot(page, testInfo, 'product-list'); // screenshot in the report
  });

  test('every listed product shows a name and a valid price', async ({ homePage }) => {
    await homePage.open();
    const names = await homePage.displayedNames();
    const prices = await homePage.displayedPrices();
    expect(names.length).toBeGreaterThan(0);
    expect(prices).toHaveLength(names.length);
    for (const name of names) {
      expect(name).not.toBe('');
    }
    for (const price of prices) {
      expect(price).toMatch(/^\$\s?\d+(\.\d{2})?$/);
      expect(parsePrice(price)).toBeGreaterThan(0);
    }
  });

  test('product details page matches the name and price shown in the list', async ({
    homePage,
    productPage,
  }) => {
    await homePage.open();
    const listed = await homePage.openProduct(0);
    await productPage.waitUntilLoaded();
    await expect(productPage.name).toHaveText(listed.name);
    expect(parsePrice(await productPage.unitPrice.innerText())).toBe(parsePrice(listed.price));
    await expect(productPage.description).toBeVisible();
    await expect(productPage.addToCartButton).toBeEnabled();
  });

  test('product price on the details page matches the API', async ({ homePage, productPage, api, page }) => {
    await homePage.open();
    await homePage.openProduct(0);
    await productPage.waitUntilLoaded();
    const id = new URL(page.url()).pathname.split('/').pop();
    const response = await api.get(`/products/${id}`);
    expect(response.status()).toBe(200);
    const product = await response.json();
    expect(parsePrice(await productPage.unitPrice.innerText())).toBe(Number(product.price));
  });

  // Data-driven sorting tests (select dropdown)
  for (const option of products.sortOptions) {
    test(`sorting by "${option}" orders the grid correctly`, async ({ homePage }) => {
      await homePage.open();
      await homePage.sortBy(option as SortValue);

      if (option.startsWith('name')) {
        const names = await homePage.displayedNames();
        const compare = option.endsWith('asc')
          ? compareText
          : (a: string, b: string) => compareText(b, a);
        expect(isSorted(names, compare)).toBe(true);
      } else {
        const prices = (await homePage.displayedPrices()).map(parsePrice);
        const compare = option.endsWith('asc')
          ? (a: number, b: number) => a - b
          : (a: number, b: number) => b - a;
        expect(isSorted(prices, compare)).toBe(true);
      }
    });
  }
});
