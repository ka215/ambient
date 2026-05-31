import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-016 Public release asset integrity @public-release', () => {
  test('loads ambient.css and ambient.js with key selectors available', async ({ ambientPage, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Public release integrity is validated on chromium only.');

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    const jsIntegrity = await page.evaluate(async () => {
      const response = await fetch('./dist/manifest.json', { cache: 'no-store' });
      if (!response.ok) {
        return {
          ok: false,
          reason: `Failed to fetch dist/manifest.json (status: ${response.status}).`,
        };
      }

      const manifest = await response.json() as Record<string, { file?: string }>;
      const entryFile = manifest?.['src/scripts/ambient.ts']?.file;
      if (typeof entryFile !== 'string' || entryFile.length === 0) {
        return {
          ok: false,
          reason: 'manifest entry for src/scripts/ambient.ts was not found.',
        };
      }

      const expectedAssetFile = entryFile.split('/').pop() || '';
      const scriptMatched = Array.from(document.querySelectorAll('script[src]')).some((script) => {
        const src = script.getAttribute('src') || '';
        return expectedAssetFile !== '' && src.includes(expectedAssetFile);
      });
      const resourceMatched = performance
        .getEntriesByType('resource')
        .some((entry) => typeof entry.name === 'string' && expectedAssetFile !== '' && entry.name.includes(expectedAssetFile));

      return {
        ok: scriptMatched || resourceMatched,
        reason: scriptMatched || resourceMatched
          ? ''
          : `JavaScript asset ${expectedAssetFile} was not observed in script tags or loaded resources.`,
      };
    });
    expect(jsIntegrity.ok, jsIntegrity.reason).toBeTruthy();

    const cssIntegrity = await page.evaluate(async () => {
      const stylesheet = document.querySelector('link[rel="stylesheet"][href*="ambient.css"]') as HTMLLinkElement | null;
      if (!stylesheet || !stylesheet.href) {
        return {
          ok: false,
          reason: 'ambient.css stylesheet was not found.',
        };
      }

      const response = await fetch(stylesheet.href, { cache: 'no-store' });
      if (!response.ok) {
        return {
          ok: false,
          reason: `Failed to fetch ambient.css (status: ${response.status}).`,
        };
      }

      const cssText = await response.text();
      const requiredSelectors = ['#btn-play', '#playlist-list-group', '#drawer-settings'];
      const missingSelectors = requiredSelectors.filter((selector) => !cssText.includes(selector));

      return {
        ok: missingSelectors.length === 0,
        reason: missingSelectors.length > 0 ? `Missing selectors in ambient.css: ${missingSelectors.join(', ')}` : '',
      };
    });

    expect(cssIntegrity.ok, cssIntegrity.reason).toBeTruthy();

    await expect.poll(async () => {
      return page.evaluate(() => {
        return !document.body.classList.contains('app-boot-pending');
      });
    }, { timeout: 15_000 }).toBeTruthy();
  });
});