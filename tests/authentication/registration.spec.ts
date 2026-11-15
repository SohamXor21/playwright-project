import { expect, test, type Page } from '@playwright/test';
import { env } from '../../config/environment';
import users from '../../test-data/users.json';
import { generateUser, type UserData } from '../../utils/test-data-generator';

// Helper: fills every field of the registration form (does not submit)
async function fillRegistrationForm(page: Page, user: UserData) {
  await page.getByTestId('first-name').fill(user.firstName);
  await page.getByTestId('last-name').fill(user.lastName);
  await page.getByTestId('dob').fill(user.dob);
  await page.getByTestId('street').fill(user.street);
  await page.getByTestId('postal_code').fill(user.postalCode);
  await page.getByTestId('house_number').fill(user.houseNumber);
  await page.getByTestId('city').fill(user.city);
  await page.getByTestId('state').fill(user.state);
if (user.country) {
  await page.getByTestId('country').selectOption(user.country);
} 
  await page.getByTestId('phone').fill(user.phone);
  await page.getByTestId('email').fill(user.email);
  await page.getByTestId('password').fill(user.password);
}

async function register(page: Page, user: UserData) {
  await fillRegistrationForm(page, user);
  await page.getByTestId('register-submit').click();
}

test.describe('User registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('a new user can register and then log in with the new account', async ({ page }) => {
    const user = generateUser(); // unique email on every run -> repeatable
    await register(page, user);
    await expect(page).toHaveURL(/\/auth\/login/);

    await page.getByTestId('email').fill(user.email);
    await page.getByTestId('password').fill(user.password);
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test('submitting an empty form shows validation errors and does not register', async ({ page }) => {
    await page.getByTestId('register-submit').click();
    await expect(page.getByTestId('first-name-error')).toContainText(/required/i);
    await expect(page.getByTestId('email-error')).toContainText(/required/i);
    await expect(page.getByTestId('password-error')).toContainText(/required/i);
  });

  // Data-driven: each required field, left empty, must raise its own error.
  for (const field of users.registrationRequiredFields) {
    test(`leaving only "${field}" empty is rejected`, async ({ page }) => {
  const user = generateUser(field === 'country' ? { country: '' } : {});
  await fillRegistrationForm(page, user);
  if (field !== 'country') {
    await page.getByTestId(field).fill('');
  }
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId(`${field}-error`)).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/register$/);
});
  }


  test('registering with an email that already exists is rejected', async ({ page }) => {
    await register(page, generateUser({ email: env.userEmail }));
    await expect(page.getByText(/already exists/i)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register$/);
  });
 

});