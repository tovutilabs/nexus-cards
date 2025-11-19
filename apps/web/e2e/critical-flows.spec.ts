/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.locator('h1')).toContainText(/sign in|login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth/login');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/email.*required/i')).toBeVisible();
    await expect(page.locator('text=/password.*required/i')).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid.*email/i')).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/auth/login');

    await page.click('text=/sign up|register/i');

    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.locator('h1')).toContainText(
      /sign up|register|create account/i
    );
  });

  test('should complete registration flow', async ({ page }) => {
    await page.goto('/auth/register');

    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or email verification page
    await page.waitForURL(/\/(dashboard|auth\/verify)/);
  });

  test('should complete login flow', async ({ page }) => {
    await page.goto('/auth/login');

    // Use seeded test user credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=/welcome|dashboard/i')).toBeVisible();
  });

  test('should log out successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Find and click logout button
    await page.click('button[aria-label="User menu"]');
    await page.click('text=/log out|sign out/i');

    // Should redirect to login page
    await page.waitForURL(/\/auth\/login/);
    await expect(page.locator('h1')).toContainText(/sign in|login/i);
  });
});

test.describe('Card Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should create a new card', async ({ page }) => {
    await page.goto('/dashboard/cards');

    await page.click('text=/create.*card|new card/i');

    // Fill card form
    await page.fill('input[name="title"]', 'My Business Card');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="jobTitle"]', 'Software Engineer');
    await page.fill('input[name="company"]', 'Tech Corp');
    await page.fill('input[name="email"]', 'john@techcorp.com');
    await page.fill('input[name="phone"]', '+1234567890');

    await page.click('button[type="submit"]');

    // Should show success message and redirect
    await expect(page.locator('text=/card.*created|success/i')).toBeVisible();
  });

  test('should edit an existing card', async ({ page }) => {
    await page.goto('/dashboard/cards');

    // Click first card's edit button
    await page.click(
      '[data-testid="card-list-item"]:first-child >> text=/edit/i'
    );

    // Update card title
    const titleInput = page.locator('input[name="title"]');
    await titleInput.clear();
    await titleInput.fill('Updated Card Title');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=/updated|saved/i')).toBeVisible();
  });

  test('should view card preview', async ({ page }) => {
    await page.goto('/dashboard/cards');

    // Click first card's preview button
    await page.click(
      '[data-testid="card-list-item"]:first-child >> text=/preview|view/i'
    );

    // Should open preview dialog or navigate to preview page
    await expect(
      page.locator('[role="dialog"], [data-testid="card-preview"]')
    ).toBeVisible();
  });

  test('should delete a card', async ({ page }) => {
    await page.goto('/dashboard/cards');

    const initialCardCount = await page
      .locator('[data-testid="card-list-item"]')
      .count();

    // Click first card's delete button
    await page.click(
      '[data-testid="card-list-item"]:first-child >> button[aria-label="Delete card"]'
    );

    // Confirm deletion
    await page.click('text=/confirm|delete/i');

    // Wait for card to be removed
    await page.waitForTimeout(500);
    const newCardCount = await page
      .locator('[data-testid="card-list-item"]')
      .count();

    expect(newCardCount).toBe(initialCardCount - 1);
  });
});

test.describe('Public Card Page', () => {
  test('should display public card', async ({ page }) => {
    // Assuming there's a seeded card with known slug
    await page.goto('/p/test-card-abc123');

    await expect(page.locator('h1, [data-testid="card-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-form"]')).toBeVisible();
  });

  test('should submit contact form', async ({ page }) => {
    await page.goto('/p/test-card-abc123');

    await page.fill('input[name="name"]', 'Jane Visitor');
    await page.fill('input[name="email"]', 'jane@example.com');
    await page.fill('input[name="phone"]', '+9876543210');
    await page.fill('textarea[name="message"]', 'Great to connect!');

    await page.click('button[type="submit"]');

    await expect(
      page.locator('text=/thank you|contact.*submitted|success/i')
    ).toBeVisible();
  });

  test('should download VCard', async ({ page }) => {
    await page.goto('/p/test-card-abc123');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=/download.*contact|save.*contact|add.*contact/i'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.vcf$/);
  });

  test('should display social links', async ({ page }) => {
    await page.goto('/p/test-card-abc123');

    const socialLinks = page.locator('[data-testid="social-links"] a');
    const count = await socialLinks.count();

    expect(count).toBeGreaterThan(0);

    // Check that links have proper attributes
    for (let i = 0; i < count; i++) {
      const link = socialLinks.nth(i);
      await expect(link).toHaveAttribute('href');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener|noreferrer/);
    }
  });
});

test.describe('NFC Tag Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display NFC tags page', async ({ page }) => {
    await page.goto('/dashboard/nfc');

    await expect(page.locator('h1, h2')).toContainText(/nfc.*tag/i);
    await expect(page.locator('[data-testid="nfc-tag-list"]')).toBeVisible();
  });

  test('should associate NFC tag with card', async ({ page }) => {
    await page.goto('/dashboard/nfc');

    // Click associate button for unlinked tag
    await page.click(
      '[data-testid="nfc-tag-item"]:has-text("Unassigned") >> button:has-text(/associate|link/i)'
    );

    // Select a card
    await page.click('select[name="cardId"] option:nth-child(2)');

    // Confirm association
    await page.click('button:has-text(/confirm|associate|link/i)');

    await expect(
      page.locator('text=/associated|linked|success/i')
    ).toBeVisible();
  });

  test('should disassociate NFC tag from card', async ({ page }) => {
    await page.goto('/dashboard/nfc');

    // Click disassociate button for linked tag
    await page.click(
      '[data-testid="nfc-tag-item"]:has-text("Linked") >> button:has-text(/disassociate|unlink/i)'
    );

    // Confirm disassociation
    await page.click('button:has-text(/confirm|disassociate|unlink/i)');

    await expect(
      page.locator('text=/disassociated|unlinked|success/i')
    ).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no automatic accessibility violations on login page', async ({
    page,
  }) => {
    await page.goto('/auth/login');

    // Check for basic accessibility requirements
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('label[for]')).toHaveCount(2);

    // Check for form labels
    const emailInput = page.locator('input[type="email"]');
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeVisible();
    await expect(emailInput).toHaveAttribute('id', 'email');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/auth/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');

    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThanOrEqual(1);

    // Check that headings appear in order
    const headings = await page.locator('h1, h2, h3, h4').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });
});
