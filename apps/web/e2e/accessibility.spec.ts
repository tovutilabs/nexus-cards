import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Key pages to test for WCAG 2.1 AA compliance
const pagesToTest = [
  { name: 'Home/Landing', path: '/' },
  { name: 'Public Card', path: '/p/johndoe' }, // Will test if exists
  { name: 'Login', path: '/auth/login' },
  { name: 'Register', path: '/auth/register' },
  { name: 'Accessibility Statement', path: '/accessibility' },
  { name: 'Privacy Policy', path: '/privacy-policy' },
  { name: 'Terms of Service', path: '/terms-of-service' },
  { name: 'FAQ', path: '/faq' },
];

const authenticatedPages = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Cards List', path: '/dashboard/cards' },
  { name: 'Contacts', path: '/dashboard/contacts' },
  { name: 'Notifications', path: '/dashboard/notifications' },
  { name: 'Settings - Account', path: '/dashboard/settings/account' },
  { name: 'Settings - Notifications', path: '/dashboard/settings/notifications' },
  { name: 'Settings - Privacy', path: '/dashboard/settings/privacy' },
];

test.describe('Accessibility Audit - Public Pages', () => {
  for (const page of pagesToTest) {
    test(`${page.name} (${page.path}) should not have accessibility violations`, async ({
      page: browserPage,
      baseURL,
    }) => {
      await browserPage.goto(page.path);

      // Wait for page to be ready
      await browserPage.waitForLoadState('networkidle');

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n=== Accessibility Violations for ${page.name} ===`);
        accessibilityScanResults.violations.forEach((violation) => {
          console.log(`\n${violation.impact?.toUpperCase()}: ${violation.help}`);
          console.log(`Description: ${violation.description}`);
          console.log(`Help URL: ${violation.helpUrl}`);
          console.log(
            `Affected elements (${violation.nodes.length}):`,
            violation.nodes.map((node) => node.html).slice(0, 3)
          );
        });
      }

      // Expect no violations
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});

test.describe('Accessibility Audit - Keyboard Navigation', () => {
  test('should be able to navigate login page with keyboard only', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Email input
    await expect(page.locator('input[type="email"]')).toBeFocused();

    await page.keyboard.press('Tab'); // Password input
    await expect(page.locator('input[type="password"]')).toBeFocused();

    await page.keyboard.press('Tab'); // Submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should show visible focus indicators', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Tab to first input
    await page.keyboard.press('Tab');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();

    // Check for visible focus indicator (outline or ring)
    const focusStyles = await emailInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have some visible focus indicator
    const hasFocusIndicator =
      focusStyles.outlineWidth !== '0px' ||
      focusStyles.outline !== 'none' ||
      focusStyles.boxShadow !== 'none';

    expect(hasFocusIndicator).toBeTruthy();
  });
});

test.describe('Accessibility Audit - ARIA and Semantics', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/accessibility');
    await page.waitForLoadState('networkidle');

    // Check for heading hierarchy (should start with h1)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // First heading should be h1
    const firstHeading = headings[0];
    const tagName = await firstHeading.evaluate((el) => el.tagName);
    expect(tagName).toBe('H1');
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Check that form inputs have labels
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');

      // Should have either aria-label, aria-labelledby, or associated label element
      const hasLabel =
        ariaLabel !== null ||
        ariaLabelledBy !== null ||
        (id !== null && (await page.locator(`label[for="${id}"]`).count()) > 0);

      expect(hasLabel).toBeTruthy();
    }
  });

  test('should have descriptive link text (no "click here")', async ({ page }) => {
    await page.goto('/accessibility');
    await page.waitForLoadState('networkidle');

    const links = await page.locator('a').all();
    const problematicLinkTexts = ['click here', 'here', 'read more', 'link'];

    for (const link of links) {
      const text = (await link.textContent())?.toLowerCase().trim() || '';
      const ariaLabel = (await link.getAttribute('aria-label'))?.toLowerCase().trim() || '';

      // Link should have descriptive text or aria-label
      if (text.length === 0 && ariaLabel.length === 0) {
        // Skip if it's an icon link with aria-hidden children
        const hasAriaHidden = await link.locator('[aria-hidden="true"]').count();
        if (hasAriaHidden === 0) {
          throw new Error('Link found with no text or aria-label');
        }
      }

      // Should not use generic link text
      if (problematicLinkTexts.includes(text) && ariaLabel.length === 0) {
        throw new Error(`Generic link text found: "${text}"`);
      }
    }
  });
});

test.describe('Accessibility Audit - Color Contrast', () => {
  test('should have sufficient color contrast (checked by axe-core)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include(['body'])
      .analyze();

    // Filter for color contrast violations specifically
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.log('\n=== Color Contrast Violations ===');
      contrastViolations.forEach((violation) => {
        console.log(`\n${violation.help}`);
        violation.nodes.forEach((node) => {
          console.log(`  - ${node.html}`);
          console.log(`    ${node.failureSummary}`);
        });
      });
    }

    expect(contrastViolations).toEqual([]);
  });
});

test.describe('Accessibility Audit - Forms', () => {
  test('login form should have accessible error messages', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Submit empty form to trigger validation
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for potential error messages
    await page.waitForTimeout(500);

    // Check if error messages are associated with form fields via aria-describedby or aria-errormessage
    const inputs = await page.locator('input[aria-invalid="true"]').all();
    for (const input of inputs) {
      const describedBy = await input.getAttribute('aria-describedby');
      const errorMessage = await input.getAttribute('aria-errormessage');

      const hasAccessibleError = describedBy !== null || errorMessage !== null;
      expect(hasAccessibleError).toBeTruthy();
    }
  });

  test('form inputs should have proper input types', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Email input should have type="email"
    const emailInput = page.locator('input[type="email"]');
    expect(await emailInput.count()).toBeGreaterThan(0);

    // Password input should have type="password"
    const passwordInput = page.locator('input[type="password"]');
    expect(await passwordInput.count()).toBeGreaterThan(0);
  });
});

test.describe('Accessibility Audit - Responsive Design', () => {
  test('should be accessible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan on mobile viewport
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be accessible on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run accessibility scan on tablet viewport
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

// Summary test that generates a comprehensive report
test.describe('Accessibility Summary Report', () => {
  test('generate accessibility audit summary', async ({ page }) => {
    console.log('\n=== ACCESSIBILITY AUDIT SUMMARY ===\n');

    const results: { page: string; violations: number; passes: number }[] = [];

    for (const testPage of pagesToTest) {
      await page.goto(testPage.path);
      await page.waitForLoadState('networkidle');

      const scanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      results.push({
        page: testPage.name,
        violations: scanResults.violations.length,
        passes: scanResults.passes.length,
      });
    }

    console.log('\nPage-by-Page Results:');
    results.forEach((result) => {
      const status = result.violations === 0 ? '✓ PASS' : '✗ FAIL';
      console.log(
        `  ${status} | ${result.page.padEnd(30)} | Violations: ${result.violations} | Passes: ${result.passes}`
      );
    });

    const totalViolations = results.reduce((sum, r) => sum + r.violations, 0);
    const totalPasses = results.reduce((sum, r) => sum + r.passes, 0);

    console.log('\nOverall Summary:');
    console.log(`  Total Pages Tested: ${results.length}`);
    console.log(`  Total Violations: ${totalViolations}`);
    console.log(`  Total Passes: ${totalPasses}`);
    console.log(
      `  Compliance Rate: ${((totalPasses / (totalPasses + totalViolations)) * 100).toFixed(1)}%`
    );
    console.log('\n======================================\n');
  });
});
