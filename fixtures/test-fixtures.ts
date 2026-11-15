import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { env } from '../config/environment';
import { AccountPage } from '../pages/AccountPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ContactPage } from '../pages/ContactPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { RegistrationPage } from '../pages/RegistrationPage';

interface Fixtures {
  homePage: HomePage;
  loginPage: LoginPage;
  accountPage: AccountPage;
  registrationPage: RegistrationPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  contactPage: ContactPage;
  /** Request context pointed at the Toolshop REST API (separate from the web front end). */
  api: APIRequestContext;
  /** Logs the demo customer in through the UI before the test starts. */
  loggedInCustomer: void;
}

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => use(new HomePage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  registrationPage: async ({ page }, use) => use(new RegistrationPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  contactPage: async ({ page }, use) => use(new ContactPage(page)),

  api: async ({}, use) => {
    const context = await request.newContext({ baseURL: env.apiUrl });
    await use(context);
    await context.dispose();
  },

  loggedInCustomer: async ({ loginPage }, use) => {
    await loginPage.open();
    await loginPage.loginSuccessfully({ email: env.userEmail, password: env.userPassword });
    await use();
  },
});

export { expect };
