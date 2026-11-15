import { test, expect } from '@playwright/test';
import { env } from '../../config/environment';

// Point Playwright's built-in `request` at the API instead of the website.
test.use({ baseURL: env.apiUrl });

test.describe('API - one test per HTTP method', () => {
  test('GET /products returns the product list', async ({ request }) => {
    const response = await request.get('/products');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('POST /users/login returns an access token', async ({ request }) => {
    const response = await request.post('/users/login', {
      data: { email: env.userEmail, password: env.userPassword },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.access_token).toBeTruthy();
  });

  test('DELETE /carts/{id} deletes a cart', async ({ request }) => {
    const created = await request.post('/carts');
    expect(created.status()).toBe(201);
    const { id } = await created.json();

    const response = await request.delete(`/carts/${id}`);
    expect(response.status()).toBe(204);
  });
});