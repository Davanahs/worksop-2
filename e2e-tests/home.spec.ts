import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    // Check that the main page heading is present
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    // Check that the site branding is present in the header (no longer an h1)
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    // Check that the welcome message is present using more specific locator
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });

  test('should filter games by category and update the URL', async ({ page }) => {
    await test.step('Select the Strategy category', async () => {
      await page.getByTestId('category-filter').selectOption({ label: 'Strategy' });
    });

    await test.step('Verify filtered results and URL state', async () => {
      await expect(page).toHaveURL(/\/\?category=\d+/);
      await expect(page.getByTestId('games-result-count')).toHaveText('Showing 4 games');
      await expect(page.getByTestId('game-card')).toHaveCount(21);
      await expect(page.getByTestId('game-card').filter({ visible: true })).toHaveCount(4);
    });
  });

  test('should combine category and publisher filters', async ({ page }) => {
    await page.getByTestId('category-filter').selectOption({ label: 'Strategy' });
    await page.getByTestId('publisher-filter').selectOption({ label: 'CodeForge Studios' });

    await expect(page.getByTestId('games-result-count')).toHaveText('Showing 1 game');
    await expect(page).toHaveURL(/\/\?category=\d+&publisher=\d+/);
    await expect(page.getByTestId('game-card').filter({ hasText: 'DevOps Dominion' })).toBeVisible();
    await expect(page.getByTestId('game-card').filter({ hasText: 'Pipeline Conquest' })).toBeHidden();
  });

  test('should restore filters from the URL and clear them', async ({ page }) => {
    await page.goto('/?category=1&publisher=1');
    await expect(page.getByTestId('category-filter')).toHaveValue('1');
    await expect(page.getByTestId('publisher-filter')).toHaveValue('1');

    await page.getByTestId('clear-filters').click();
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('games-result-count')).toHaveText('Showing 21 games');
  });
});
