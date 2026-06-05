import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-016 Public release asset integrity @public-release', () => {
  test('loads ambient.css and ambient.js with key selectors available', async ({ ambientPage, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Public release integrity is validated on chromium only.');

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await expect.poll(async () => {
      return page.evaluate(() => !document.body.classList.contains('app-boot-pending'));
    }, { timeout: 15_000 }).toBeTruthy();

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
      const assetUrl = new URL(entryFile, document.baseURI).toString();
      const assetResponse = await fetch(assetUrl, { cache: 'no-store' });

      return {
        ok: assetResponse.ok,
        reason: assetResponse.ok
          ? ''
          : `JavaScript asset ${expectedAssetFile} could not be fetched (status: ${assetResponse.status}).`,
      };
    });
    expect(jsIntegrity.ok, jsIntegrity.reason).toBeTruthy();

    const cssIntegrity = await page.evaluate(async () => {
      const response = await fetch('./dist/manifest.json', { cache: 'no-store' });
      if (!response.ok) {
        return {
          ok: false,
          reason: `Failed to fetch dist/manifest.json (status: ${response.status}).`,
        };
      }

      const manifest = await response.json() as Record<string, { css?: string[] }>;
      const cssFile = manifest?.['src/scripts/ambient.ts']?.css?.[0];
      if (typeof cssFile !== 'string' || cssFile.length === 0) {
        return {
          ok: false,
          reason: 'manifest entry for ambient.css was not found.',
        };
      }

      const cssUrl = new URL(cssFile, document.baseURI).toString();
      const stylesheetResponse = await fetch(cssUrl, { cache: 'no-store' });
      if (!stylesheetResponse.ok) {
        return {
          ok: false,
          reason: `Failed to fetch ambient.css (status: ${stylesheetResponse.status}).`,
        };
      }

      return {
        ok: (await stylesheetResponse.text()).length > 0,
        reason: 'ambient.css was fetched but returned an empty response.',
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