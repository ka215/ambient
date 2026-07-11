import { bindAmbientViewportLifecycle } from './app-init';

export interface InitializeViewportLifecycleRuntimeOptions {
  drawerPlaylist: HTMLElement | null;
  drawerSettings: HTMLElement | null;
  modalOptions: HTMLElement | null;
  currentWindowSize: { width: number; minFullUIWidth: number };
  viewportRuntime: {
    setMenuMinimized(minimized: boolean): void;
    syncMetrics(): void;
    updateWindowSize(): void;
    refreshMetricsAfter(delayMs: number): void;
    scheduleMetricsSync(delayMs: number): void;
  };
}

export function initializeViewportLifecycleRuntime(options: InitializeViewportLifecycleRuntimeOptions): void {
  bindAmbientViewportLifecycle({
    drawerPlaylist: options.drawerPlaylist,
    drawerSettings: options.drawerSettings,
    modalOptions: options.modalOptions,
    getCurrentWidth: () => options.currentWindowSize.width,
    minFullUIWidth: options.currentWindowSize.minFullUIWidth,
    setMenuMinimized: (minimized) => {
      options.viewportRuntime.setMenuMinimized(minimized);
    },
    syncViewportMetrics: () => {
      options.viewportRuntime.syncMetrics();
    },
    updateWindowSize: () => {
      options.viewportRuntime.updateWindowSize();
    },
    refreshViewportMetricsAfter: (delayMs) => {
      options.viewportRuntime.refreshMetricsAfter(delayMs);
    },
    scheduleViewportMetricsSync: (delayMs) => {
      options.viewportRuntime.scheduleMetricsSync(delayMs);
    },
  });
}
