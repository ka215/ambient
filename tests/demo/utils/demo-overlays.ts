import type { Locator, Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

type CursorPoint = {
  x: number;
  y: number;
};

const INITIAL_CURSOR_POINT: CursorPoint = { x: 980, y: 720 };
const DEFAULT_CURSOR_SVG = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 3.5 25 18.2 16.9 19.3 21.2 28.1 17.7 29.8 13.4 21 7.9 27.1 6 3.5Z" fill="#111827"/>
  <path d="M8.2 8.2 20.1 17.3 14.4 18.1 18.2 25.8 17.8 26 14 18.3 9.9 22.9 8.2 8.2Z" fill="#ffffff"/>
</svg>`;

export async function installDemoOverlays(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      #amp-demo-cursor {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 2147483647;
        width: 32px;
        height: 32px;
        pointer-events: none;
        transform: translate3d(${INITIAL_CURSOR_POINT.x}px, ${INITIAL_CURSOR_POINT.y}px, 0);
        transition: transform 560ms cubic-bezier(.22, 1, .36, 1), filter 120ms ease;
        filter: drop-shadow(0 4px 8px rgb(15 23 42 / 35%));
      }
      #amp-demo-cursor svg {
        display: block;
        width: 32px;
        height: 32px;
      }
      #amp-demo-cursor.amp-demo-cursor-down {
        filter: drop-shadow(0 2px 4px rgb(15 23 42 / 28%));
      }
      .amp-demo-click-ring {
        position: fixed;
        z-index: 2147483646;
        width: 12px;
        height: 12px;
        margin-left: -6px;
        margin-top: -6px;
        border: 2px solid #2563eb;
        border-radius: 9999px;
        pointer-events: none;
        animation: amp-demo-click-ring 520ms ease-out forwards;
      }
      @keyframes amp-demo-click-ring {
        from {
          opacity: .9;
          transform: scale(.45);
        }
        to {
          opacity: 0;
          transform: scale(3.4);
        }
      }
      .amp-demo-highlight {
        outline: 4px solid #f59e0b !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 8px rgb(245 158 11 / 18%) !important;
        transition: outline-color 160ms ease, box-shadow 160ms ease !important;
      }
    `,
  });
  await page.evaluate(({ point, cursorSvg }) => {
    const existing = document.getElementById('amp-demo-cursor');
    if (existing) {
      existing.remove();
    }
    const cursor = document.createElement('div');
    cursor.id = 'amp-demo-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = cursorSvg;
    document.body.appendChild(cursor);
    (window as unknown as { __ampDemoCursorPoint?: CursorPoint }).__ampDemoCursorPoint = point;
  }, { point: INITIAL_CURSOR_POINT, cursorSvg: resolveCursorSvg() });
}

export async function highlight(page: Page, selector: string, durationMs = 1200): Promise<void> {
  await page.evaluate(({ targetSelector }) => {
    document.querySelectorAll('.amp-demo-highlight').forEach((element) => {
      element.classList.remove('amp-demo-highlight');
    });
    const element = document.querySelector<HTMLElement>(targetSelector);
    if (element) {
      element.classList.add('amp-demo-highlight');
      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    }
  }, { targetSelector: selector });
  await page.waitForTimeout(durationMs);
}

export async function clearHighlight(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll('.amp-demo-highlight').forEach((element) => {
      element.classList.remove('amp-demo-highlight');
    });
  });
}

export async function moveCursorToSelector(
  page: Page,
  selector: string,
  durationMs = 650
): Promise<void> {
  const point = await page.evaluate((targetSelector) => {
    const element = document.querySelector<HTMLElement>(targetSelector);
    if (!element) {
      return null;
    }
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
    const rect = element.getBoundingClientRect();
    return {
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  }, selector);

  if (point) {
    await moveCursorToPoint(page, point, durationMs);
  }
}

export async function moveCursorToLocator(
  page: Page,
  locator: Locator,
  durationMs = 650
): Promise<CursorPoint> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Cannot move demo cursor because target locator has no bounding box.');
  }

  const point = {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(box.y + box.height / 2),
  };
  await moveCursorToPoint(page, point, durationMs);
  return point;
}

export async function humanClick(
  page: Page,
  locator: Locator,
  options: { moveMs?: number; holdMs?: number } = {}
): Promise<void> {
  const moveMs = options.moveMs ?? 620;
  const holdMs = options.holdMs ?? 90;
  const point = await moveCursorToLocator(page, locator, moveMs);
  await page.mouse.move(point.x, point.y, { steps: process.env.AMP_DEMO_FAST === '1' ? 4 : 24 });
  await page.evaluate(() => {
    document.getElementById('amp-demo-cursor')?.classList.add('amp-demo-cursor-down');
  });
  await page.mouse.down();
  await page.waitForTimeout(process.env.AMP_DEMO_FAST === '1' ? 20 : holdMs);
  await emitClickRing(page, point);
  await page.mouse.up();
  await page.evaluate(() => {
    document.getElementById('amp-demo-cursor')?.classList.remove('amp-demo-cursor-down');
  });
}

export async function humanFill(
  page: Page,
  locator: Locator,
  value: string,
  options: { moveMs?: number; delayMs?: number } = {}
): Promise<void> {
  await humanClick(page, locator, { moveMs: options.moveMs ?? 560 });
  await locator.fill('');
  await locator.pressSequentially(value, {
    delay: process.env.AMP_DEMO_FAST === '1' ? 0 : options.delayMs ?? 24,
  });
}

async function moveCursorToPoint(page: Page, point: CursorPoint, durationMs: number): Promise<void> {
  const fast = process.env.AMP_DEMO_FAST === '1';
  const effectiveDuration = fast ? Math.min(durationMs, 100) : durationMs;
  await page.evaluate(({ nextPoint, transitionMs }) => {
    const cursor = document.getElementById('amp-demo-cursor');
    if (!cursor) {
      return;
    }
    cursor.style.transitionDuration = `${transitionMs}ms, 120ms`;
    cursor.style.transform = `translate3d(${nextPoint.x}px, ${nextPoint.y}px, 0)`;
    (window as unknown as { __ampDemoCursorPoint?: CursorPoint }).__ampDemoCursorPoint = nextPoint;
  }, { nextPoint: point, transitionMs: effectiveDuration });
  await page.waitForTimeout(effectiveDuration + (fast ? 10 : 80));
}

async function emitClickRing(page: Page, point: CursorPoint): Promise<void> {
  await page.evaluate((ringPoint) => {
    const ring = document.createElement('div');
    ring.className = 'amp-demo-click-ring';
    ring.style.left = `${ringPoint.x}px`;
    ring.style.top = `${ringPoint.y}px`;
    document.body.appendChild(ring);
    window.setTimeout(() => ring.remove(), 560);
  }, point);
}

function resolveCursorSvg(): string {
  const cursorPath = process.env.AMP_DEMO_CURSOR_SVG_PATH;
  if (!cursorPath) {
    return DEFAULT_CURSOR_SVG;
  }

  const resolvedPath = path.resolve(process.cwd(), cursorPath);
  if (!existsSync(resolvedPath)) {
    return DEFAULT_CURSOR_SVG;
  }

  return readFileSync(resolvedPath, 'utf8');
}
