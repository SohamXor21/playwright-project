import { expect, type Locator, type Page } from '@playwright/test';

/** Shared behaviour for every page object: navigation, header elements, readiness check. */
export abstract class BasePage {
  protected abstract readonly path: string;

  readonly navHome: Locator;
  readonly signInLink: Locator;
  readonly navMenu: Locator;
  readonly signOutLink: Locator;
  readonly cartLink: Locator;
  readonly cartQuantity: Locator;

  constructor(protected readonly page: Page) {
    // The site uses data-test attributes; playwright.config.ts maps getByTestId to them.
    this.navHome = page.getByTestId('nav-home');
    this.signInLink = page.getByTestId('nav-sign-in');
    this.navMenu = page.getByTestId('nav-menu');
    this.signOutLink = page.getByTestId('nav-sign-out');
    this.cartLink = page.getByTestId('nav-cart');
    this.cartQuantity = page.getByTestId('cart-quantity');
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitUntilLoaded();
  }

  /** Pages override this with the element that proves they are usable. Auto-waits via expect. */
  async waitUntilLoaded(): Promise<void> {
    await expect(this.navHome).toBeAttached();
  }

  async logout(): Promise<void> {
    await this.navMenu.click();
    await this.signOutLink.click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /** Number shown on the cart badge in the header (0 when the badge is not rendered). */
  async cartCount(): Promise<number> {
    if ((await this.cartQuantity.count()) === 0) {
      return 0;
    }
    const text = (await this.cartQuantity.innerText()).trim();
    return Number(text) || 0;
  }
}
