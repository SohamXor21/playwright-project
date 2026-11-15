import { expect, type Locator, type Page } from '@playwright/test';
import type { BillingAddress } from '../utils/test-data-generator';
import { futureCardExpiry } from '../utils/helpers';
import { BasePage } from './BasePage';

export type PaymentMethod =
  | 'bank-transfer'
  | 'cash-on-delivery'
  | 'credit-card'
  | 'buy-now-pay-later'
  | 'gift-card';

/**
 * Steps 2-4 of the checkout wizard (sign-in confirmation, billing address, payment).
 * Step 1 (the cart) lives in CartPage.
 */
export class CheckoutPage extends BasePage {
  protected readonly path = '/checkout';

  readonly proceedFromSignIn: Locator;
  readonly street: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly country: Locator;
  readonly postalCode: Locator;
  readonly proceedFromBilling: Locator;
  readonly paymentMethod: Locator;
  readonly cardNumber: Locator;
  readonly cardExpiry: Locator;
  readonly cardCvv: Locator;
  readonly cardHolder: Locator;
  readonly finish: Locator;
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;

  constructor(page: Page) {
    super(page);
    this.proceedFromSignIn = page.getByTestId('proceed-2');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.proceedFromBilling = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.cardNumber = page
      .getByTestId('credit_card_number')
      .or(page.getByPlaceholder('1111-1111-1111-1111'));
    this.cardExpiry = page.getByTestId('expiration_date').or(page.getByPlaceholder('MM/YYYY'));
    this.cardCvv = page.getByTestId('cvv').or(page.getByPlaceholder('123'));
    this.cardHolder = page.getByTestId('card_holder_name');
    this.finish = page.getByTestId('finish');
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.locator('#order-confirmation').or(page.getByTestId('order-confirmation'));
  }

  override async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkout/);
  }

  /** Step 2: a logged-in customer only has to confirm. */
  async confirmSignedInStep(): Promise<void> {
    await this.proceedFromSignIn.click();
    await expect(this.street).toBeVisible();
  }

  /** Step 3: fills every billing field (overwrites any pre-filled profile data). */
  async fillBilling(address: BillingAddress): Promise<void> {
    await this.street.fill(address.street);
    await this.city.fill(address.city);
    await this.state.fill(address.state);
    await this.country.fill(address.country);
    await this.postalCode.fill(address.postalCode);
  }

  async continueToPayment(): Promise<void> {
    await this.proceedFromBilling.click();
    await expect(this.paymentMethod).toBeVisible();
  }

  async choosePayment(method: PaymentMethod): Promise<void> {
    await this.paymentMethod.selectOption(method); // <select> dropdown
  }

  async fillCreditCard(cardHolder = 'Auto Tester'): Promise<void> {
    await this.cardNumber.fill('1111-1111-1111-1111'); // dummy number accepted by the demo shop
    await this.cardExpiry.fill(futureCardExpiry());
    await this.cardCvv.fill('123');
    await this.cardHolder.fill(cardHolder);
  }

  /** Confirms payment, then confirms the order. Returns once the confirmation is shown. */
  async placeOrder(): Promise<void> {
    await this.finish.click();
    await expect(this.paymentSuccess).toBeVisible();
    await this.finish.click();
    await expect(this.orderConfirmation).toBeVisible();
  }
}
