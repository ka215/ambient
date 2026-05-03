import { expect, Locator, Page } from '@playwright/test';

export async function expectPlaylistItemsLoaded(page: Page): Promise<void> {
  const items = page.locator('#playlist-list-group a[data-playlist-item]');
  await expect(items.first()).toBeVisible();
}

export async function expectPlayButtonEnabled(page: Page): Promise<void> {
  await expect(page.locator('#btn-play')).toBeEnabled();
}

export async function expectPlayPauseSwapped(page: Page): Promise<void> {
  await expect(page.locator('#btn-play')).toHaveClass(/hidden/);
  await expect(page.locator('#btn-pause')).not.toHaveClass(/hidden/);
}

export async function expectPausePlaySwapped(page: Page): Promise<void> {
  await expect(page.locator('#btn-pause')).toHaveClass(/hidden/);
  await expect(page.locator('#btn-play')).not.toHaveClass(/hidden/);
}

export async function expectCurrentPlaylistItem(locator: Locator): Promise<void> {
  await expect(locator).toHaveAttribute('aria-current', 'true');
}
