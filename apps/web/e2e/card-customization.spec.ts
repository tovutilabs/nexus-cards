import { test, expect } from '@playwright/test';

test.describe('Card Customization Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'user.pro@example.com');
    await page.fill('input[type="password"]', 'User123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/);
  });

  test('should customize card with template, styling, and components', async ({ page }) => {
    await page.goto('/en/dashboard/cards');
    
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    const customizeButton = page.getByRole('button', { name: /customize/i });
    await customizeButton.click();
    
    await page.waitForURL(/\/customize$/);
    
    await page.getByRole('tab', { name: /templates/i }).click();
    
    const templateCard = page.locator('[data-template-card]').first();
    await templateCard.locator('button', { hasText: /apply/i }).click();
    
    await expect(page.getByText(/template applied/i)).toBeVisible({ timeout: 5000 });
    
    await page.getByRole('tab', { name: /colors/i }).click();
    
    const colorButton = page.locator('[data-testid="color-palette"] button').first();
    await colorButton.click();
    
    await page.waitForTimeout(1500);
    
    await page.getByRole('tab', { name: /typography/i }).click();
    
    const fontSelect = page.locator('select[name="fontFamily"]');
    await fontSelect.selectOption('roboto');
    
    await page.waitForTimeout(1500);
    
    await page.getByRole('tab', { name: /layout/i }).click();
    
    const layoutOption = page.getByLabel(/horizontal/i);
    await layoutOption.click();
    
    await page.waitForTimeout(1500);
    
    await page.getByRole('tab', { name: /components/i }).click();
    
    const addComponentButton = page.getByRole('button', { name: /add component/i });
    await addComponentButton.click();
    
    const galleryComponent = page.getByText('Gallery');
    await galleryComponent.click();
    
    await expect(page.getByText(/gallery/i)).toBeVisible();
    
    const cardSlug = await page.locator('[data-card-slug]').getAttribute('data-card-slug');
    
    await page.goto(`/p/${cardSlug}`);
    
    await expect(page.locator('.card-identity-header')).toBeVisible();
    
    await expect(page.locator('[data-component-type="GALLERY"]')).toBeVisible();
    
    const computedStyle = await page.locator('.card-container').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily,
        flexDirection: styles.flexDirection,
      };
    });
    
    expect(computedStyle.fontFamily).toContain('Roboto');
  });

  test('should reorder components with drag and drop', async ({ page }) => {
    await page.goto('/en/dashboard/cards');
    
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('tab', { name: /components/i }).click();
    
    const addButton = page.getByRole('button', { name: /add component/i });
    
    await addButton.click();
    await page.getByText('About').click();
    await page.waitForTimeout(500);
    
    await addButton.click();
    await page.getByText('Contact').click();
    await page.waitForTimeout(500);
    
    const componentItems = page.locator('[data-component-item]');
    await expect(componentItems).toHaveCount(2);
    
    const firstComponent = componentItems.first();
    const secondComponent = componentItems.nth(1);
    
    const firstBox = await firstComponent.boundingBox();
    const secondBox = await secondComponent.boundingBox();
    
    if (firstBox && secondBox) {
      await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 5 });
      await page.mouse.up();
      
      await page.waitForTimeout(1000);
    }
    
    const reorderedItems = page.locator('[data-component-item]');
    const firstItemType = await reorderedItems.first().getAttribute('data-component-type');
    expect(firstItemType).toBe('CONTACT');
  });

  test('should edit component configuration', async ({ page }) => {
    await page.goto('/en/dashboard/cards');
    
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('tab', { name: /components/i }).click();
    
    const addButton = page.getByRole('button', { name: /add component/i });
    await addButton.click();
    await page.getByText('About').click();
    
    await page.waitForTimeout(500);
    
    const editButton = page.locator('[data-component-item]').first().getByRole('button', { name: /edit/i });
    await editButton.click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    
    const textArea = page.getByRole('textbox', { name: /about text/i });
    await textArea.fill('This is my updated about section with rich content.');
    
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();
    
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    await page.waitForTimeout(1500);
    
    const preview = page.locator('[data-preview-container]');
    await expect(preview.getByText(/updated about section/i)).toBeVisible();
  });

  test('should delete component', async ({ page }) => {
    await page.goto('/en/dashboard/cards');
    
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('tab', { name: /components/i }).click();
    
    const addButton = page.getByRole('button', { name: /add component/i });
    await addButton.click();
    await page.getByText('About').click();
    
    await page.waitForTimeout(500);
    
    const deleteButton = page.locator('[data-component-item]').first().getByRole('button', { name: /delete/i });
    await deleteButton.click();
    
    const confirmButton = page.getByRole('button', { name: /confirm/i });
    await confirmButton.click();
    
    await page.waitForTimeout(1000);
    
    await expect(page.locator('[data-component-item]')).toHaveCount(0);
  });

  test('should respect tier limits for components', async ({ page }) => {
    await page.goto('/auth/logout');
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'user.free@example.com');
    await page.fill('input[type="password"]', 'User123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/);
    
    await page.goto('/en/dashboard/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('tab', { name: /components/i }).click();
    
    const addButton = page.getByRole('button', { name: /add component/i });
    
    await addButton.click();
    await page.getByText('About').click();
    await page.waitForTimeout(500);
    
    await addButton.click();
    await page.getByText('Contact').click();
    await page.waitForTimeout(500);
    
    await addButton.click();
    await page.getByText('Profile').click();
    await page.waitForTimeout(500);
    
    await addButton.click();
    
    await expect(page.getByText(/tier limit/i)).toBeVisible();
  });

  test('should show locked components for premium features', async ({ page }) => {
    await page.goto('/auth/logout');
    await page.goto('/auth/login');
    
    await page.fill('input[type="email"]', 'user.free@example.com');
    await page.fill('input[type="password"]', 'User123!');
    await page.click('button[type="submit"]');
    
    await page.goto('/en/dashboard/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    await page.getByRole('button', { name: /customize/i }).click();
    await page.getByRole('tab', { name: /components/i }).click();
    
    const addButton = page.getByRole('button', { name: /add component/i });
    await addButton.click();
    
    const galleryComponent = page.getByText('Gallery').closest('[data-component-card]');
    const lockIcon = galleryComponent?.locator('[data-testid="lock-icon"]');
    
    await expect(lockIcon).toBeVisible();
    await expect(galleryComponent).toContainText(/pro/i);
  });

  test('should persist customizations on page reload', async ({ page }) => {
    await page.goto('/en/dashboard/cards');
    
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();
    
    await page.getByRole('button', { name: /customize/i }).click();
    
    await page.getByRole('tab', { name: /colors/i }).click();
    const colorButton = page.locator('[data-testid="color-palette"] button').nth(2);
    await colorButton.click();
    
    await page.waitForTimeout(1500);
    
    await page.reload();
    
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('tab', { name: /colors/i }).click();
    
    const selectedColor = page.locator('[data-testid="selected-color-indicator"]');
    await expect(selectedColor).toBeVisible();
  });
});
