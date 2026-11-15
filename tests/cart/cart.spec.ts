import { expect, test } from '../../fixtures/test-fixtures';
import { parsePrice, roundMoney } from '../../utils/helpers';

test.describe('Shopping cart (guest)', () => {
  let productName: string;

  // Hook: each test opens the shop and the first product so it can add it to the cart.
  test.beforeEach(async ({ homePage, productPage }) => {
    await homePage.open();
    ({ name: productName } = await homePage.openProduct(0));
    await productPage.waitUntilLoaded();
  });

  test('adding a product puts it in the cart and updates the header badge', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.addToCart();
    await expect(productPage.cartQuantity).toHaveText('1');

    await productPage.openCart();
    await cartPage.waitUntilLoaded();
    await expect(cartPage.row(productName)).toHaveCount(1);
    await expect(cartPage.quantityInput(productName)).toHaveValue('1');
  });

  test('adding several units sets the quantity in the cart', async ({ productPage, cartPage }) => {
    await productPage.addToCart(3);
    await productPage.openCart();
    await cartPage.waitUntilLoaded();
    await expect(cartPage.quantityInput(productName)).toHaveValue('3');
  });

  test('line total equals unit price multiplied by quantity, and the cart total matches', async ({
    productPage,
    cartPage,
  }) => {
    await productPage.addToCart(2);
    await productPage.openCart();
    await cartPage.waitUntilLoaded();

    const unit = parsePrice(await cartPage.unitPrice(productName).innerText());
    await expect(cartPage.linePrice(productName)).toContainText(roundMoney(unit * 2).toFixed(2));
    await cartPage.expectTotalMatchesLines();
  });

  test('changing the quantity recalculates the line and cart totals', async ({ productPage, cartPage }) => {
    await productPage.addToCart();
    await productPage.openCart();
    await cartPage.waitUntilLoaded();

    const unit = parsePrice(await cartPage.unitPrice(productName).innerText());
    await cartPage.setQuantity(productName, 4);
    await expect(cartPage.linePrice(productName)).toContainText(roundMoney(unit * 4).toFixed(2));
    await cartPage.expectTotalMatchesLines();
  });

  test('removing the only product leaves an empty cart', async ({ productPage, cartPage }) => {
    await productPage.addToCart();
    await productPage.openCart();
    await cartPage.waitUntilLoaded();

    await cartPage.removeProduct(productName);
    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.rows).toHaveCount(0);
  });

  test('cart contents persist after reloading the page', async ({ productPage, cartPage, page }) => {
    await productPage.addToCart(2);
    await productPage.openCart();
    await cartPage.waitUntilLoaded();

    await page.reload();
    await cartPage.waitUntilLoaded();
    await expect(cartPage.quantityInput(productName)).toHaveValue('2');
  });
  
});


