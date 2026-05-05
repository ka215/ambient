import { Locator, Page } from '@playwright/test';

export async function getPlaylistItems(page: Page): Promise<Locator[]> {
  const items = page.locator('#playlist-list-group a[data-playlist-item]');
  const count = await items.count();
  const locators: Locator[] = [];

  for (let index = 0; index < count; index += 1) {
    locators.push(items.nth(index));
  }

  return locators;
}

export async function getPlaylistItemCount(page: Page): Promise<number> {
  return page.locator('#playlist-list-group a[data-playlist-item]').count();
}

export async function findYoutubePlaylistItem(page: Page): Promise<Locator | null> {
  const items = page.locator('#playlist-list-group a[data-playlist-item]');
  const count = await items.count();

  for (let index = 0; index < count; index += 1) {
    const candidate = items.nth(index);
    const src = await candidate.locator('img').first().getAttribute('src');
    if (src && src.includes('img.youtube.com/vi/')) {
      return candidate;
    }
  }

  return null;
}
