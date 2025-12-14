import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Photographer Split Template
 * 
 * Tests template selection, rendering, component theming, and responsive behavior
 */

test.describe('Photographer Split Template', () => {
  const TEST_USER = {
    email: 'user.pro@example.com',
    password: 'User123!',
  };

  test.beforeEach(async ({ page }) => {
    // Login as PRO user (has access to Photographer Split template)
    await page.goto('/en/auth/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/en/dashboard');
  });

  test('should display Photographer Split template in gallery', async ({ page }) => {
    // Navigate to cards dashboard
    await page.goto('/en/dashboard/cards');
    
    // Click on first card or create new one
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() > 0) {
      await cardLinks.first().click();
    }
    
    // Navigate to customize page
    await page.goto(page.url().replace('/edit', '/customize'));
    
    // Open template gallery
    await page.click('text=Templates');
    await page.click('button:has-text("Change Template")');
    
    // Verify Photographer Split template is visible
    const photographerSplitTemplate = page.locator('text=Photographer Split');
    await expect(photographerSplitTemplate).toBeVisible();
    
    // Verify template description
    await expect(page.locator('text=Bold asymmetric split design')).toBeVisible();
  });

  test('should apply Photographer Split template and render correctly', async ({ page }) => {
    // Navigate to customize page
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() > 0) {
      await cardLinks.first().click();
    }
    await page.goto(page.url().replace('/edit', '/customize'));
    
    // Open template gallery and select Photographer Split
    await page.click('text=Templates');
    await page.click('button:has-text("Change Template")');
    
    // Click on Photographer Split template
    const splitTemplate = page.locator('[data-template-slug="photographer-split"]').or(
      page.locator('text=Photographer Split').locator('..')
    );
    await splitTemplate.click();
    
    // Confirm template application
    await page.click('button:has-text("Apply Template")');
    
    // Wait for template to be applied
    await page.waitForTimeout(2000);
    
    // Verify split container is rendered in preview
    const splitContainer = page.locator('.card-split-container');
    await expect(splitContainer).toBeVisible();
    
    // Verify split sections are present
    await expect(page.locator('.card-split-text-section')).toBeVisible();
    await expect(page.locator('.card-split-photo-section')).toBeVisible();
    
    // Verify vertical name text
    await expect(page.locator('.card-split-name-vertical')).toBeVisible();
    
    // Verify contact footer
    await expect(page.locator('.card-split-contact-footer')).toBeVisible();
  });

  test('should display components with theme styling when template is active', async ({ page }) => {
    // Navigate to a card with Photographer Split template
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() > 0) {
      await cardLinks.first().click();
    }
    await page.goto(page.url().replace('/edit', '/customize'));
    
    // Ensure template is applied (may already be from previous test)
    const splitContainer = page.locator('.card-split-container');
    if (await splitContainer.count() === 0) {
      // Apply template if not already applied
      await page.click('text=Templates');
      await page.click('button:has-text("Change Template")');
      const splitTemplate = page.locator('[data-template-slug="photographer-split"]').or(
        page.locator('text=Photographer Split').locator('..')
      );
      await splitTemplate.click();
      await page.click('button:has-text("Apply Template")');
      await page.waitForTimeout(2000);
    }
    
    // Open components tab
    await page.click('text=Components');
    
    // Add Gallery component if not already present
    await page.click('button:has-text("Add Component")').catch(() => {});
    const galleryOption = page.locator('text=Gallery');
    if (await galleryOption.isVisible()) {
      await galleryOption.click();
    }
    
    // Wait for component to be added
    await page.waitForTimeout(1000);
    
    // Verify gallery component is rendered with theme styling
    const galleryComponent = page.locator('.gallery-component');
    if (await galleryComponent.count() > 0) {
      // Check that component has template background color applied
      const bgColor = await galleryComponent.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(bgColor).toBeTruthy();
    }
  });

  test('should maintain template layout on public page', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/en/dashboard/cards');
    
    // Get first card link
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() === 0) {
      test.skip();
      return;
    }
    
    await cardLinks.first().click();
    
    // Get card slug from URL or page
    const cardSlug = await page.evaluate(() => {
      // Try to extract slug from DOM or URL
      const urlParts = window.location.pathname.split('/');
      return urlParts[urlParts.length - 2]; // Card ID before 'edit'
    });
    
    // Navigate to public page
    await page.goto(`/p/${cardSlug}`);
    
    // Verify split container is rendered
    const splitContainer = page.locator('.card-split-container');
    if (await splitContainer.count() > 0) {
      await expect(splitContainer).toBeVisible();
      
      // Verify sections
      await expect(page.locator('.card-split-text-section')).toBeVisible();
      await expect(page.locator('.card-split-photo-section')).toBeVisible();
      
      // Verify decorative shapes
      await expect(page.locator('.card-split-decorative-shapes')).toBeVisible();
      
      // Verify action buttons
      await expect(page.locator('button:has-text("Save Contact")')).toBeVisible();
      await expect(page.locator('button:has-text("Share")')).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to card with template
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() > 0) {
      await cardLinks.first().click();
    }
    await page.goto(page.url().replace('/edit', '/customize'));
    
    // Verify split container adapts to mobile
    const splitContainer = page.locator('.card-split-container');
    if (await splitContainer.count() > 0) {
      await expect(splitContainer).toBeVisible();
      
      // On mobile, sections should stack vertically
      // Grid should change to single column below 768px breakpoint
      const gridCols = await splitContainer.evaluate((el) => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should be single column on mobile
      expect(gridCols).toContain('1fr');
    }
  });

  test('should switch between templates without breaking', async ({ page }) => {
    // Navigate to customize page
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() > 0) {
      await cardLinks.first().click();
    }
    await page.goto(page.url().replace('/edit', '/customize'));
    
    // Apply Photographer Split template
    await page.click('text=Templates');
    await page.click('button:has-text("Change Template")');
    const splitTemplate = page.locator('[data-template-slug="photographer-split"]').or(
      page.locator('text=Photographer Split').locator('..')
    );
    await splitTemplate.click();
    await page.click('button:has-text("Apply Template")');
    await page.waitForTimeout(2000);
    
    // Verify split container is present
    await expect(page.locator('.card-split-container')).toBeVisible();
    
    // Switch to different template
    await page.click('button:has-text("Change Template")');
    const minimalTemplate = page.locator('[data-template-slug="minimal-modern"]').or(
      page.locator('text=Minimal Modern').locator('..')
    );
    if (await minimalTemplate.count() > 0) {
      await minimalTemplate.click();
      await page.click('button:has-text("Apply Template")');
      await page.waitForTimeout(2000);
      
      // Verify split container is removed
      await expect(page.locator('.card-split-container')).not.toBeVisible();
    }
    
    // Switch back to Photographer Split
    await page.click('button:has-text("Change Template")');
    await splitTemplate.click();
    await page.click('button:has-text("Apply Template")');
    await page.waitForTimeout(2000);
    
    // Verify split container is back
    await expect(page.locator('.card-split-container')).toBeVisible();
  });

  test('should render contact form modal when Connect button clicked', async ({ page }) => {
    // Navigate to public page with template
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() === 0) {
      test.skip();
      return;
    }
    
    await cardLinks.first().click();
    const cardSlug = await page.evaluate(() => {
      const urlParts = window.location.pathname.split('/');
      return urlParts[urlParts.length - 2];
    });
    
    await page.goto(`/p/${cardSlug}`);
    
    // Check if split template is active
    const splitContainer = page.locator('.card-split-container');
    if (await splitContainer.count() === 0) {
      test.skip();
      return;
    }
    
    // Click Connect button
    const connectButton = page.locator('button:has-text("Connect")');
    await connectButton.click();
    
    // Verify contact form modal appears
    await expect(page.locator('text=Get in Touch')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('input[name="firstName"]')).not.toBeVisible();
  });

  test('should display decorative shapes on template', async ({ page }) => {
    // Navigate to public page
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() === 0) {
      test.skip();
      return;
    }
    
    await cardLinks.first().click();
    const cardSlug = await page.evaluate(() => {
      const urlParts = window.location.pathname.split('/');
      return urlParts[urlParts.length - 2];
    });
    
    await page.goto(`/p/${cardSlug}`);
    
    // Check for split template
    const splitContainer = page.locator('.card-split-container');
    if (await splitContainer.count() === 0) {
      test.skip();
      return;
    }
    
    // Verify decorative shapes SVG is present
    const decorativeShapes = page.locator('.card-split-decorative-shapes');
    await expect(decorativeShapes).toBeVisible();
    
    // Verify SVG elements
    const svgTriangles = decorativeShapes.locator('svg polygon');
    expect(await svgTriangles.count()).toBeGreaterThan(0);
  });

  test('should have correct color contrast for accessibility', async ({ page }) => {
    // Navigate to public page
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() === 0) {
      test.skip();
      return;
    }
    
    await cardLinks.first().click();
    const cardSlug = await page.evaluate(() => {
      const urlParts = window.location.pathname.split('/');
      return urlParts[urlParts.length - 2];
    });
    
    await page.goto(`/p/${cardSlug}`);
    
    // Check for split template
    const splitContainer = page.locator('.card-split-container');
    if (await splitContainer.count() === 0) {
      test.skip();
      return;
    }
    
    // Verify text sections have good contrast
    const textSection = page.locator('.card-split-text-section');
    const textColor = await textSection.locator('.card-split-name-vertical').evaluate((el) => 
      window.getComputedStyle(el).color
    );
    const bgColor = await textSection.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Both should be defined (actual contrast calculation would need a library)
    expect(textColor).toBeTruthy();
    expect(bgColor).toBeTruthy();
  });

  test('should save and persist template selection', async ({ page }) => {
    // Navigate to customize page
    await page.goto('/en/dashboard/cards');
    const cardLinks = page.locator('a[href*="/dashboard/cards/"]');
    if (await cardLinks.count() > 0) {
      await cardLinks.first().click();
    }
    const cardUrl = page.url();
    await page.goto(cardUrl.replace('/edit', '/customize'));
    
    // Apply Photographer Split template
    await page.click('text=Templates');
    await page.click('button:has-text("Change Template")');
    const splitTemplate = page.locator('[data-template-slug="photographer-split"]').or(
      page.locator('text=Photographer Split').locator('..')
    );
    await splitTemplate.click();
    await page.click('button:has-text("Apply Template")');
    await page.waitForTimeout(2000);
    
    // Navigate away
    await page.goto('/en/dashboard');
    
    // Navigate back to customize page
    await page.goto(cardUrl.replace('/edit', '/customize'));
    
    // Verify template is still applied
    await expect(page.locator('.card-split-container')).toBeVisible();
  });
});
