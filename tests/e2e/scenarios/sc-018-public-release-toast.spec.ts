import { expect, test } from '../fixtures/ambient-page.fixture';

/**
 * Public smoke for toast visibility on cloud demo.
 * This uses playlist import because it reliably emits a success toast in cloud mode
 * without changing server-side assets.
 */
test.describe('SC-018 Public release toast smoke @public-release', () => {
  test('shows success toast after cloud playlist import', async ({ ambientPage, page, browserName }) => {
    test.setTimeout(90_000);
    test.skip(browserName !== 'chromium', 'Public release verification is validated on chromium only.');

    await page.addInitScript(() => {
      localStorage.clear();
    });

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(String(error));
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await page.locator('#btn-options').click();
    await page.waitForFunction(() => {
      const modal = document.getElementById('modal-options');
      return modal ? !modal.classList.contains('hidden') : false;
    }, { timeout: 10_000 });

    const heading = page.locator('#collapse-item-heading-playlist button');
    await heading.click();

    await page.waitForFunction(() => {
      const body = document.getElementById('collapse-item-body-playlist');
      return body ? !body.classList.contains('hidden') : false;
    }, { timeout: 10_000 });

    const validImportJson = JSON.stringify({
      Imported: [
        {
          title: 'Public Toast E2E',
          videoid: 'dQw4w9WgXcQ',
          artist: 'E2E Artist',
          desc: 'public toast smoke',
        },
      ],
      options: {
        volume: 45,
      },
    });

    await page.setInputFiles('#playlist-import-file', {
      name: 'public-toast-e2e-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validImportJson, 'utf8'),
    });

    await page.locator('#btn-import-playlist').click();

    // Import success side-effect check: if this succeeds but no toast is visible,
    // it strongly indicates a toast rendering/visibility regression.
    await expect.poll(async () => {
      return page.evaluate(() => {
        const playlist = document.getElementById('current-playlist') as HTMLSelectElement | null;
        const hasItem = document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length > 0;
        return (playlist?.value === 'MyPlaylist.json') && hasItem;
      });
    }, { timeout: 12_000 }).toBeTruthy();

    const toastVisible = await page.waitForFunction(() => {
      const toast = document.getElementById('alert-notification');
      if (!toast) return false;
      const visible = !toast.classList.contains('hidden') && !toast.classList.contains('notice-toast--hidden');
      return visible && toast.classList.contains('bg-green-50');
    }, { timeout: 8_000 }).then(() => true).catch(() => false);

    if (!toastVisible) {
      const diagnostics = await page.evaluate(() => {
        const toast = document.getElementById('alert-notification');
        const message = document.getElementById('alert-message');
        const playlist = document.getElementById('current-playlist') as HTMLSelectElement | null;
        return {
          playlistValue: playlist?.value || '',
          playlistItems: document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length,
          toastClass: toast?.className || '(missing)',
          toastAriaHidden: toast?.getAttribute('aria-hidden') || '(none)',
          toastMessage: String(message?.textContent || '').trim(),
        };
      });
      throw new Error(
        [
          'Import side-effects were observed but toast was not visibly rendered.',
          `playlist=${diagnostics.playlistValue}`,
          `playlistItems=${diagnostics.playlistItems}`,
          `toastClass=${diagnostics.toastClass}`,
          `toastAriaHidden=${diagnostics.toastAriaHidden}`,
          `toastMessage=${diagnostics.toastMessage}`,
        ].join('\n')
      );
    }

    await page.waitForFunction(() => {
      const message = document.getElementById('alert-message');
      return !!message && String(message.textContent || '').trim().length > 0;
    }, { timeout: 5_000 });

    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      throw new Error(
        [
          `Unexpected errors during toast smoke`,
          `pageerror: ${pageErrors.join(' | ') || '(none)'}`,
          `console.error: ${consoleErrors.join(' | ') || '(none)'}`,
        ].join('\n')
      );
    }
  });
});
