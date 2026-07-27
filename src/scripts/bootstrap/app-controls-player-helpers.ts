export interface CreateAppControlsPlayerHelpersOptions {
  playItem(target: HTMLElement): void;
  playItemById(playId: number): void;
  isFullWindowMode(): boolean;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
  setMenuMinimized(minimized: boolean): void;
  getPlayer(): {
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
  } | null | undefined;
}

export interface AppControlsPlayerHelpers {
  playItem(target: HTMLElement): void;
  playItemById(playId: number): void;
  isFullWindowMode(): boolean;
  setFullWindowMode(enabled: boolean, syncOption?: boolean, closeDrawers?: boolean): void;
  setMenuMinimized(minimized: boolean): void;
  getPlayer(): {
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
  } | null | undefined;
}

export function createAppControlsPlayerHelpers(
  options: CreateAppControlsPlayerHelpersOptions
): AppControlsPlayerHelpers {
  return {
    playItem: options.playItem,
    playItemById: options.playItemById,
    isFullWindowMode: options.isFullWindowMode,
    setFullWindowMode: options.setFullWindowMode,
    setMenuMinimized: options.setMenuMinimized,
    getPlayer: options.getPlayer,
  };
}
