import type { Page } from '@playwright/test';

export type BootTraceRecord = {
  label: string;
  t: number;
  dataBoot: string | null;
  splashClass: string | null;
  splashDisplay: string | null;
  splashOpacity: string | null;
  centerDelta: {
    x: number;
    y: number;
  } | null;
};

export type BootTraceSummary = {
  traceCount: number;
  domContentLoaded: BootTraceRecord | null;
  pending: BootTraceRecord | null;
  transition: BootTraceRecord | null;
  ready: BootTraceRecord | null;
  minVisibleMsObserved: number | null;
  fadeMsObserved: number | null;
  maxAbsCenterDelta: number | null;
};

export async function installBootTrace(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__ambientBootTrace = [];

    const pushBootTrace = (label: string) => {
      const body = document.body;
      const splash = document.getElementById('app-boot-splash');
      const loader = document.querySelector('#app-boot-splash .app-boot-loader');
      let centerDelta = null;

      if (loader) {
        const rect = loader.getBoundingClientRect();
        centerDelta = {
          x: Math.round((rect.left + rect.width / 2) - (window.innerWidth / 2)),
          y: Math.round((rect.top + rect.height / 2) - (window.innerHeight / 2)),
        };
      }

      window.__ambientBootTrace.push({
        label,
        t: performance.now(),
        dataBoot: body ? body.getAttribute('data-boot') : null,
        splashClass: splash ? splash.className : null,
        splashDisplay: splash ? getComputedStyle(splash).display : null,
        splashOpacity: splash ? getComputedStyle(splash).opacity : null,
        centerDelta,
      });
    };

    document.addEventListener('DOMContentLoaded', () => {
      pushBootTrace('domcontentloaded');
      const body = document.body;
      const splash = document.getElementById('app-boot-splash');
      const observer = new MutationObserver(() => pushBootTrace('mutation'));

      if (body) {
        observer.observe(body, { attributes: true, attributeFilter: ['class', 'data-boot'] });
      }
      if (splash) {
        observer.observe(splash, { attributes: true, attributeFilter: ['class', 'style'] });
      }

      const intervalId = window.setInterval(() => {
        pushBootTrace('interval');
        if (document.body?.getAttribute('data-boot') === 'ready') {
          window.clearInterval(intervalId);
          observer.disconnect();
          pushBootTrace('ready-sampled');
        }
      }, 100);
    });
  });
}

export async function readBootTraceSummary(page: Page): Promise<BootTraceSummary> {
  return page.evaluate(() => {
    const trace = window.__ambientBootTrace || [];
    const domContentLoaded = trace.find((record) => record.label === 'domcontentloaded') || null;
    const pending = trace.find((record) => record.dataBoot === 'pending') || null;
    const transition = trace.find((record) => record.dataBoot === 'transition') || null;
    const ready = trace.find((record) => record.dataBoot === 'ready') || null;
    const centerDeltas = trace
      .filter((record) => {
        const opacity = Number(record.splashOpacity ?? '1');
        return record.splashDisplay !== 'none' && (!Number.isFinite(opacity) || opacity > 0);
      })
      .map((record) => record.centerDelta)
      .filter((delta): delta is { x: number; y: number } => Boolean(delta));
    const maxAbsCenterDelta = centerDeltas.length
      ? Math.max(...centerDeltas.flatMap((delta) => [Math.abs(delta.x), Math.abs(delta.y)]))
      : null;

    return {
      traceCount: trace.length,
      domContentLoaded,
      pending,
      transition,
      ready,
      minVisibleMsObserved: pending && transition ? Math.round(transition.t - pending.t) : null,
      fadeMsObserved: transition && ready ? Math.round(ready.t - transition.t) : null,
      maxAbsCenterDelta,
    };
  });
}

declare global {
  interface Window {
    __ambientBootTrace: BootTraceRecord[];
  }
}
