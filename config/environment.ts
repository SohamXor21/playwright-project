import dotenv from 'dotenv';
import path from 'path';

// Load variables from <project>/.env (if present). Real environment variables win.
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function optional(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in ` +
        `(in GitHub Actions, add it as a repository secret).`,
    );
  }
  return value;
}

/**
 * Central place for configuration. Credentials are getters so that a missing
 * value only fails the tests that actually need it, with a clear message.
 */
export const env = {
  baseUrl: optional('BASE_URL', 'https://practicesoftwaretesting.com'),
  apiUrl: optional('API_URL', 'https://api.practicesoftwaretesting.com'),
  get userEmail(): string {
    return required('USER_EMAIL');
  },
  get userPassword(): string {
    return required('USER_PASSWORD');
  },
  get adminEmail(): string | undefined {
    return process.env.ADMIN_EMAIL?.trim() || undefined;
  },
  get adminPassword(): string | undefined {
    return process.env.ADMIN_PASSWORD?.trim() || undefined;
  },
};
