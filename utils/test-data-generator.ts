import { randomBytes } from 'crypto';

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dob: string; // YYYY-MM-DD
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string; // ISO code, e.g. "US"
  postalCode: string;
  houseNumber: string;
}

const token = (bytes = 4): string => randomBytes(bytes).toString('hex');

/** Unique, repeatable-safe email: timestamp + random suffix. example.com is reserved for testing. */
export function uniqueEmail(prefix = 'qa.user'): string {
  return `${prefix}.${Date.now()}.${token()}@example.com`;
}

/** Random password with upper/lower case, digits and symbols. Generated per run, never stored. */
export function generateStrongPassword(): string {
  return `Qa!${token(6)}Zz9#`;
}

/** Brand-new user for registration tests. Pass overrides to build invalid variants. */
export function generateUser(overrides: Partial<UserData> = {}): UserData {
  return {
    firstName: 'Auto',
    lastName: `Tester${token(3)}`,
    email: uniqueEmail(),
    password: generateStrongPassword(),
    dob: '1990-05-15',
    phone: '0612345678',
    street: '123 Test Street',
    houseNumber: '123',
    city: 'Los Angeles',
    state: 'California',
    country: 'US',
    postalCode: '90001',
    ...overrides,
  };
}

export interface BillingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export function generateBillingAddress(): BillingAddress {
  const user = generateUser();
  return {
    street: user.street,
    city: user.city,
    state: user.state,
    country: 'United States',
    postalCode: user.postalCode,
  };
}
