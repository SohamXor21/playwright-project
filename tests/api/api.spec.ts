import { request, test, expect, type APIRequestContext } from '@playwright/test';
import { env } from '../../config/environment';
import { generateUser, type UserData } from '../../utils/test-data-generator';

/** Request body for POST /users/register and PUT /users/{id}. */
function userPayload(user: UserData, includePassword = true) {
  return {
    first_name: user.firstName,
    last_name: user.lastName,
    address: {
      street: user.street,
      city: user.city,
      state: user.state,
      country: user.country,
      postal_code: user.postalCode,
    },
    phone: user.phone,
    dob: user.dob,
    email: user.email,
    ...(includePassword ? { password: user.password } : {}),
  };
}

// One request context for the whole file: created in beforeAll, disposed in afterAll.
let api: APIRequestContext;

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: env.apiUrl });
});

test.afterAll(async () => {
  await api.dispose();
});

async function login(email: string, password: string): Promise<string> {
  const response = await api.post('/users/login', { data: { email, password } });
  expect(response.status(), 'login should succeed').toBe(200);
  const body = await response.json();
  return body.access_token as string;
}

test.describe('API - catalogue (GET)', () => {
  test('GET /products returns a paginated list as JSON', async () => {
    const response = await api.get('/products');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(typeof body.total).toBe('number');
    expect(body.current_page).toBe(1);
    for (const product of body.data) {
      expect(typeof product.id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(Number(product.price)).toBeGreaterThan(0);
    }
  });

  test('GET /products/{id} returns the requested product', async () => {
    const list = await (await api.get('/products')).json();
    const first = list.data[0];

    const response = await api.get(`/products/${first.id}`);
    expect(response.status()).toBe(200);
    const product = await response.json();
    expect(product.id).toBe(first.id);
    expect(product.name).toBe(first.name);
    expect(Number(product.price)).toBe(Number(first.price));
  });

  test('GET /products/search?q= returns only matching products', async () => {
    const response = await api.get('/products/search', { params: { q: 'hammer' } });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
    for (const product of body.data) {
      expect(product.name.toLowerCase()).toContain('hammer');
    }
  });

  test('GET /products?sort=price,desc returns prices in descending order', async () => {
    const response = await api.get('/products', { params: { sort: 'price,desc' } });
    expect(response.status()).toBe(200);
    const prices = (await response.json()).data.map((p: { price: number }) => Number(p.price));
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('GET /brands returns a non-empty list', async () => {
    const response = await api.get('/brands');
    expect(response.status()).toBe(200);
    const brands = await response.json();
    expect(Array.isArray(brands)).toBe(true);
    expect(brands.length).toBeGreaterThan(0);
    expect(brands[0]).toHaveProperty('name');
  });

  test('GET /categories returns a non-empty list', async () => {
    const response = await api.get('/categories');
    expect(response.status()).toBe(200);
    const categories = await response.json();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty('name');
  });

  test('GET /products/{unknown id} returns 404 with a JSON error', async () => {
    const response = await api.get('/products/00000000000000000000000000');
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

test.describe('API - authentication', () => {
  test('POST /users/login with valid credentials returns a bearer token', async () => {
    const response = await api.post('/users/login', {
      data: { email: env.userEmail, password: env.userPassword },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.access_token).toBe('string');
    expect(body.access_token.length).toBeGreaterThan(20);
    expect(body.token_type).toBe('bearer');
    expect(body.expires_in).toBeGreaterThan(0);
  });

  test('POST /users/login with a wrong password returns 401', async () => {
    const response = await api.post('/users/login', {
      data: { email: env.userEmail, password: 'Definitely-Wrong-1!' },
    });
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe('Unauthorized');
  });

  test('GET /users/me returns the logged-in customer', async () => {
    const token = await login(env.userEmail, env.userPassword);
    const response = await api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status()).toBe(200);
    expect((await response.json()).email).toBe(env.userEmail);
  });

  test('GET /users/me without a token returns 401', async () => {
    const response = await api.get('/users/me');
    expect(response.status()).toBe(401);
  });
});

test.describe('API - user lifecycle (POST, PUT, DELETE)', () => {
  test('POST /users/register creates a user who can then log in', async () => {
    const user = generateUser();
    const response = await api.post('/users/register', { data: userPayload(user) });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.email).toBe(user.email);

    const token = await login(user.email, user.password);
    expect(token).toBeTruthy();
  });

  test('POST /users/register with an existing email is rejected with 422', async () => {
    const response = await api.post('/users/register', {
      data: userPayload(generateUser({ email: env.userEmail })),
    });
    expect(response.status()).toBe(422);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('POST /users/register with an empty body is rejected with 422', async () => {
    const response = await api.post('/users/register', { data: {} });
    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(Object.keys(body).length).toBeGreaterThan(0);
  });

  test('PUT /users/{id} updates the profile of the logged-in user', async () => {
    const user = generateUser();
    const created = await (await api.post('/users/register', { data: userPayload(user) })).json();
    const token = await login(user.email, user.password);
    const auth = { Authorization: `Bearer ${token}` };

    const update = await api.put(`/users/${created.id}`, {
      headers: auth,
      data: { ...userPayload(user, false), first_name: 'Updated' },
    });
    expect(update.status()).toBe(200);

    const me = await (await api.get('/users/me', { headers: auth })).json();
    expect(me.first_name).toBe('Updated');
  });

  test('DELETE /users/{id} as admin removes the user', async () => {
    test.skip(!env.adminEmail || !env.adminPassword, 'ADMIN_EMAIL / ADMIN_PASSWORD not set');

    const user = generateUser();
    const created = await (await api.post('/users/register', { data: userPayload(user) })).json();
    const adminToken = await login(env.adminEmail as string, env.adminPassword as string);

    const response = await api.delete(`/users/${created.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(response.status()).toBe(204);

    const loginAgain = await api.post('/users/login', {
      data: { email: user.email, password: user.password },
    });
    expect(loginAgain.status()).toBe(401);
  });
});

test.describe('API - cart (POST, GET, DELETE)', () => {
  test('a cart can be created, filled, read and deleted', async () => {
    const productId = (await (await api.get('/products')).json()).data[0].id as string;

    const created = await api.post('/carts');
    expect(created.status()).toBe(201);
    const cartId = (await created.json()).id as string;
    expect(cartId).toBeTruthy();

    const added = await api.post(`/carts/${cartId}`, { data: { product_id: productId, quantity: 2 } });
    expect(added.status()).toBe(200);

    const cart = await (await api.get(`/carts/${cartId}`)).json();
    const item = cart.cart_items.find((i: { product_id: string }) => i.product_id === productId);
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);

    const removed = await api.delete(`/carts/${cartId}`);
    expect(removed.status()).toBe(204);
  });
});
