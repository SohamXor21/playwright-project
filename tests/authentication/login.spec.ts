import { expect, test, type Page } from '@playwright/test';
import { env } from '../../config/environment';
import users from '../../test-data/users.json';

async function login(page: Page, email: string, password: string) {
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('login-submit').click();
}

test.describe('Authentication - login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('valid credentials log the customer in', async ({ page }) => {
    await login(page, env.userEmail, env.userPassword);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
  });

  test('wrong password shows an error', async ({ page }) => {
    await login(page, env.userEmail, 'Definitely-Wrong-1!');
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
  });

  for (const c of users.invalidCredentials) {
    test(`rejected for ${c.description}`, async ({ page }) => {
      await login(page, c.email, c.password);
      await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    });
  }

  test('empty fields show required errors', async ({ page }) => {
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('email-error')).toContainText(/required/i);
    await expect(page.getByTestId('password-error')).toContainText(/required/i);
  });

  test('logout returns to signed-out state', async ({ page }) => {
    await login(page, env.userEmail, env.userPassword);
    await page.getByTestId('nav-menu').click();
    await page.getByTestId('nav-sign-out').click();
    await expect(page.getByTestId('nav-sign-in')).toBeVisible();
  });
});