import type { ResponsiveDrawerElements } from './drawers';
import {
  applyFullWindowMode,
  applyFullWindowModeWorkflow,
  applyMenuMinimizedState,
  refreshViewportMetricsTask,
  scheduleViewportMetricsSyncTask,
  syncViewportLayout,
  syncViewportMetricsState,
  updateViewportLayoutWorkflow,
} from './viewport';

export interface ViewportRuntimeState {
  height: number;
  minFullUIWidth: number;
  width: number;
}

export interface CreateViewportRuntimeControllerOptions {
  body: HTMLElement;
  menu: HTMLElement | null;
  menuCollapseButton: HTMLButtonElement | null;
  toggleInput: HTMLInputElement | null;
  drawerElements: ResponsiveDrawerElements;
  state: ViewportRuntimeState;
  getViewportWidth: () => number;
  getViewportHeight: () => number;
  getBottomMenuHeight: () => number;
  getPlayerSizeForCurrentMode: () => { width: number; height: number };
  isFullWindowMode: () => boolean;
  getPlayer: () => unknown;
  getHtmlPlayer: () => HTMLVideoElement | null;
  clearTimer: (timerId: number) => void;
  setTimer: (handler: () => void, delay: number) => number;
  persistFullWindowOption: (enabled: boolean) => void;
  syncFullWindowButtonState: (enabled: boolean) => void;
  syncMenuCollapseButtonState: (minimized: boolean) => void;
  onCaptionRefresh: () => void;
}

export interface ViewportRuntimeController {
  refreshMetricsAfter(delay: number): void;
  scheduleMetricsSync(delay?: number): void;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
  setMenuMinimized(minimized: boolean): void;
  syncMetrics(): void;
  updateWindowSize(): void;
}

export function createViewportRuntimeController(
  options: CreateViewportRuntimeControllerOptions
): ViewportRuntimeController {
  let viewportMetricsTimer: number | null = null;

  const syncMetrics = (): void => {
    syncViewportMetricsState({
      getViewportWidth: options.getViewportWidth,
      getViewportHeight: options.getViewportHeight,
      getBottomMenuHeight: options.getBottomMenuHeight,
      onMeasured: ({ width, height }) => {
        options.state.width = width;
        options.state.height = height;
      },
    });
  };

  const updateWindowSize = (): void => {
    updateViewportLayoutWorkflow({
      currentWidth: options.state.width,
      currentHeight: options.state.height,
      getViewportWidth: options.getViewportWidth,
      getViewportHeight: options.getViewportHeight,
      onMeasured: ({ width, height }) => {
        options.state.width = width;
        options.state.height = height;
      },
      syncLayout: ({ width, height }) => {
        syncViewportLayout({
          width,
          height,
          getBottomMenuHeight: options.getBottomMenuHeight,
          isFullWindow: options.isFullWindowMode(),
          getPlayerSizeForCurrentMode: options.getPlayerSizeForCurrentMode,
          player: options.getPlayer(),
          htmlPlayer: options.getHtmlPlayer(),
          drawerElements: options.drawerElements,
          minFullUiWidth: options.state.minFullUIWidth,
          onAfterResponsiveLayout: options.onCaptionRefresh,
        });
      },
    });
  };

  const scheduleMetricsSync = (delay = 0): void => {
    scheduleViewportMetricsSyncTask({
      currentTimer: viewportMetricsTimer,
      delay,
      clearTimer: options.clearTimer,
      setTimer: options.setTimer,
      onTimerChange: (timerId) => {
        viewportMetricsTimer = timerId;
      },
      runSync: syncMetrics,
      onAfterSync: updateWindowSize,
    });
  };

  const refreshMetricsAfter = (delay: number): void => {
    refreshViewportMetricsTask({
      delay,
      setTimer: options.setTimer,
      runSync: syncMetrics,
      onAfterSync: updateWindowSize,
    });
  };

  const setFullWindowMode = (enabled: boolean, syncOption = true, closeDrawers = false): void => {
    applyFullWindowModeWorkflow({
      applyMode: () => {
        applyFullWindowMode({
          body: options.body,
          enabled,
          toggleInput: options.toggleInput,
          closeDrawers,
          shouldAutoCloseDrawers: options.state.width < options.state.minFullUIWidth,
          playlistDrawer: options.drawerElements.playlistDrawer,
          settingsDrawer: options.drawerElements.settingsDrawer,
          playlistCloseButton: options.drawerElements.playlistCloseButton,
          settingsCloseButton: options.drawerElements.settingsCloseButton,
        });
      },
      syncOption: syncOption
        ? () => {
          options.persistFullWindowOption(enabled);
        }
        : undefined,
      syncButtonState: () => {
        options.syncFullWindowButtonState(enabled);
      },
      onLayoutRefresh: updateWindowSize,
      onCaptionRefresh: options.onCaptionRefresh,
      scheduleMetricsRefresh: refreshMetricsAfter,
    });
  };

  const setMenuMinimized = (minimized: boolean): void => {
    applyMenuMinimizedState({
      body: options.body,
      menu: options.menu,
      minimized,
      syncButtonState: (nextMinimized: boolean) => {
        options.syncMenuCollapseButtonState(nextMinimized);
      },
      afterToggle: options.onCaptionRefresh,
    });
  };

  return {
    refreshMetricsAfter,
    scheduleMetricsSync,
    setFullWindowMode,
    setMenuMinimized,
    syncMetrics,
    updateWindowSize,
  };
}
