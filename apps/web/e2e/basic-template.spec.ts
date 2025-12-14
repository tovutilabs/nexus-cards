import { test, expect, Page } from '@playwright/test';

// E2E smoke tests for Basic Business card template

test.describe('Basic Business Template', () => {
  const TEST_USER = {
    email: 'user.free@example.com',
    password: 'User123!',
  };

  const openFirstCardCustomize = async (page: Page) => {
    await page.goto('/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() === 0) {
      test.skip();
      return;
    }
    await cardLinks.first().click();
    await page.goto(page.url().replace('/edit', '/customize'));
  };

  const applyBasicTemplate = async (page: Page) => {
    await page.click('text=Templates');
    await page.click('button:has-text("Change Template")');
    const basicTemplate = page
      .locator('[data-template-slug="basic-business"]').or(
        page.locator('text=Basic Business Card').locator('..')
      );
    await basicTemplate.click();
    await page.click('button:has-text("Apply Template")');
    await page.waitForTimeout(1500);
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard heading to confirm navigation
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 15000 });
  });

  test('applies Basic Business template in customize view', async ({ page }) => {
    await openFirstCardCustomize(page);
    await applyBasicTemplate(page);

    const basicContainer = page.locator('.card-basic-container');
    await expect(basicContainer).toBeVisible();
    await expect(page.locator('button:has-text("Save Contact")')).toBeVisible();
  });

  test('renders Basic Business template on public page', async ({ page }) => {
    await openFirstCardCustomize(page);
    await applyBasicTemplate(page);

    // Derive slug and visit public page
    const cardSlug = await page.evaluate(() => {
      const parts = window.location.pathname.split('/');
      return parts[parts.length - 2];
    });

    await page.goto(`/p/${cardSlug}`);

    const basicContainer = page.locator('.card-basic-container');
    await expect(basicContainer).toBeVisible();
    await expect(page.locator('button:has-text("Save Contact")')).toBeVisible();
  });
});
