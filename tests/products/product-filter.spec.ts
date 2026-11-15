import { expect, test } from '../../fixtures/test-fixtures';
import products from '../../test-data/products.json';

test.describe('Products - category filters (checkboxes)', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.open();
  });

  for (const category of products.filterCategories) {
    test(`filtering by "${category}" narrows the list and can be cleared`, async ({ homePage, api }) => {
      const all = await api.get('/products');
      const unfilteredTotal = (await all.json()).total as number;

      const filtered = await homePage.setCategoryFilter(category, true);
      expect(filtered.data.length).toBeGreaterThan(0);
      expect(filtered.total).toBeLessThan(unfilteredTotal);

      const cleared = await homePage.setCategoryFilter(category, false);
      expect(cleared.total).toBe(unfilteredTotal);
    });
  }
});
