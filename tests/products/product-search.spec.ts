import { expect, test } from '../../fixtures/test-fixtures';
import products from '../../test-data/products.json';

test.describe('Products - search', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  for (const term of products.searchTerms) {
    test(`searching for "${term}" returns only matching products`, async ({ homePage }) => {
      const payload = await homePage.search(term);
      expect(payload.data.length).toBeGreaterThan(0);
      for (const name of await homePage.displayedNames()) {
        expect(name.toLowerCase()).toContain(term);
      }
      await expect(homePage.searchCaption).toContainText(term);
    });
  }

  test('a search with no matches shows the "no products" message', async ({ homePage }) => {
    const payload = await homePage.search(products.noResultTerm);
    expect(payload.data).toHaveLength(0);
    await expect(homePage.noResults).toBeVisible();
    await expect(homePage.productCards).toHaveCount(0);
  });

  test('resetting the search restores the full product list', async ({ homePage }) => {
    await homePage.search(products.searchTerms[0]);
    const restored = await homePage.resetSearch();
    expect(restored.data.length).toBeGreaterThan(0);
    await expect(homePage.searchBox).toHaveValue('');
  });
});
