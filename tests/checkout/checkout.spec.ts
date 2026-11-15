import { expect, test } from '../../fixtures/test-fixtures';
import users from '../../test-data/users.json';
import { generateBillingAddress } from '../../utils/test-data-generator';

test.describe('Checkout (signed-in customer)', () => {
  let productName: string;

  // Hook: sign in (fixture), then put the first product in the cart and open the cart.
  test.beforeEach(async ({ loggedInCustomer, homePage, productPage, cartPage }) => {
    void loggedInCustomer;
    await homePage.open();
    ({ name: productName } = await homePage.openProduct(0));
    await productPage.waitUntilLoaded();
    await productPage.addToCart();
    await productPage.openCart();
    await cartPage.waitUntilLoaded();
  });

  test('order summary in the cart lists the chosen product with a matching total', async ({ cartPage }) => {
    await expect(cartPage.row(productName)).toHaveCount(1);
    await expect(cartPage.quantityInput(productName)).toHaveValue('1');
    await cartPage.expectTotalMatchesLines();
    expect(await cartPage.displayedTotal()).toBeGreaterThan(0);
    await expect(cartPage.proceedButton).toBeEnabled();
  });

  test('customer can complete checkout with cash on delivery', async ({ cartPage, checkoutPage }) => {
    await cartPage.proceedButton.click();
    await checkoutPage.confirmSignedInStep();
    await checkoutPage.fillBilling(generateBillingAddress());
    await checkoutPage.continueToPayment();
    await checkoutPage.choosePayment('cash-on-delivery');
    await checkoutPage.placeOrder();
    await expect(checkoutPage.orderConfirmation).toContainText(/thanks for your order/i);
    await expect(checkoutPage.orderConfirmation).toContainText(/INV-/);
  });

  test('customer can complete checkout with a credit card', async ({ cartPage, checkoutPage }) => {
    await cartPage.proceedButton.click();
    await checkoutPage.confirmSignedInStep();
    await checkoutPage.fillBilling(generateBillingAddress());
    await checkoutPage.continueToPayment();
    await checkoutPage.choosePayment('credit-card');
    await checkoutPage.fillCreditCard();
    await checkoutPage.placeOrder();
    await expect(checkoutPage.orderConfirmation).toContainText(/INV-/);
  });

  // Data-driven: clearing any mandatory billing field must block the next step.
  for (const field of users.billingRequiredFields) {
    test(`billing step cannot continue when "${field}" is empty`, async ({ cartPage, checkoutPage, page }) => {
      await cartPage.proceedButton.click();
      await checkoutPage.confirmSignedInStep();
      await checkoutPage.fillBilling(generateBillingAddress());
      await expect(checkoutPage.proceedFromBilling).toBeEnabled();

      await page.getByTestId(field).fill('');
      await expect(checkoutPage.proceedFromBilling).toBeDisabled();
    });
  }

  test('payment cannot be completed with invalid credit card details', async ({ cartPage, checkoutPage }) => {
    await cartPage.proceedButton.click();
    await checkoutPage.confirmSignedInStep();
    await checkoutPage.fillBilling(generateBillingAddress());
    await checkoutPage.continueToPayment();
    await checkoutPage.choosePayment('credit-card');
    await checkoutPage.cardNumber.fill('not-a-card');
    await checkoutPage.cardExpiry.fill('00/0000');
    await checkoutPage.cardCvv.fill('x');
    await expect(checkoutPage.finish).toBeDisabled();
    await expect(checkoutPage.paymentSuccess).toBeHidden();
  });

  test('payment cannot be confirmed before a payment method is chosen', async ({ cartPage, checkoutPage }) => {
    await cartPage.proceedButton.click();
    await checkoutPage.confirmSignedInStep();
    await checkoutPage.fillBilling(generateBillingAddress());
    await checkoutPage.continueToPayment();
    await expect(checkoutPage.finish).toBeDisabled();
  });
});
