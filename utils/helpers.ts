import type { Page, TestInfo } from '@playwright/test';

/** Extracts a number from text such as "$14.15" or "$ 1,299.00". */
export function parsePrice(text: string): number {
  const match = text.replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!match) {
    throw new Error(`No price found in "${text}"`);
  }
  return Number(match[0]);
}

/** Rounds to cents to avoid floating point noise when summing prices. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sum(values: number[]): number {
  return roundMoney(values.reduce((total, value) => total + value, 0));
}

/** Case-insensitive text comparison used for name sorting checks. */
export function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base' });
}

export function isSorted<T>(values: T[], compare: (a: T, b: T) => number): boolean {
  return values.every((value, index) => index === 0 || compare(values[index - 1], value) <= 0);
}

/** Card expiry in the MM/YYYY format used by the checkout form, always in the future. */
export function futureCardExpiry(yearsAhead = 2): string {
  const year = new Date().getFullYear() + yearsAhead;
  return `12/${year}`;
}

/** Attaches a full-page screenshot to the HTML report (also used for failed tests). */
export async function attachScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

/** Escapes a string so it can be used safely inside a RegExp. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
