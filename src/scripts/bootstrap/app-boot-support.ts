import type { AppBootController } from './app-boot';

export interface CreateAppBootSupportOptions {
  onViewportReady(): void;
}

export interface AppBootSupport {
  onReady(): void;
  scheduleFailSafeRelease(appBoot: AppBootController, delayMs?: number): void;
}

export function createAppBootSupport(
  options: CreateAppBootSupportOptions
): AppBootSupport {
  return {
    onReady: () => {
      options.onViewportReady();
    },
    scheduleFailSafeRelease: (appBoot, delayMs = 3500) => {
      window.setTimeout(() => {
        appBoot.forceRelease();
      }, delayMs);
    },
  };
}
