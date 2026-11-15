import path from 'path';
import { expect, test } from '../../fixtures/test-fixtures';
import { uniqueEmail } from '../../utils/test-data-generator';

const attachmentPath = path.resolve(__dirname, '../../test-data/sample-attachment.txt');

test.describe('Contact form - file upload', () => {
  test.beforeEach(async ({ contactPage }) => {
    await contactPage.open();
  });

  test('a message with a file attachment is sent successfully', async ({ contactPage }) => {
    await contactPage.fillForm({
      firstName: 'Auto',
      lastName: 'Tester',
      email: uniqueEmail('contact'),
      message: 'Automated test message that is long enough to satisfy the minimum length rule of the form.',
    });
    await contactPage.attachFile(attachmentPath);
    await expect(contactPage.attachment).toHaveValue(/sample-attachment\.txt/);

    await contactPage.submit.click();
    await expect(contactPage.successAlert).toBeVisible();
  });

  test('submitting an empty contact form shows validation errors', async ({ contactPage, page }) => {
    await contactPage.submit.click();
    await expect(contactPage.validationErrors.first()).toBeVisible();
    await expect(contactPage.successAlert).toBeHidden();
    await expect(page).toHaveURL(/\/contact$/);
  });
});
