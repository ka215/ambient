import { isFullWindowMode as isFullWindowModeView } from '../ui/viewport';

export interface CreateStatusWatcherSupportOptions {
  body: HTMLElement;
  getOption(key: string): unknown;
  getPlaylistUiFacade(): {
    updateCategory(): void;
  };
  viewportRuntime: {
    setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
  };
}

export interface StatusWatcherSupport {
  getOption(key: string): unknown;
  updatePlaylistCategory(): void;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
  isFullWindowMode(): boolean;
}

export function createStatusWatcherSupport(
  options: CreateStatusWatcherSupportOptions
): StatusWatcherSupport {
  return {
    getOption: options.getOption,
    updatePlaylistCategory: () => {
      options.getPlaylistUiFacade().updateCategory();
    },
    setFullWindowMode: (enabled, syncOption = true, closeDrawers = false) => {
      options.viewportRuntime.setFullWindowMode(enabled, syncOption, closeDrawers);
    },
    isFullWindowMode: () => isFullWindowModeView(options.body),
  };
}
