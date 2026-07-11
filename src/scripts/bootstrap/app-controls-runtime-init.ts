import type { MediaItem } from '../types/ambient';
import type { PlaylistMode } from '../ui/playlist-view';
import { bindAmbientAppControlBindings } from './app-init';

export interface InitializeAppControlsRuntimeOptions {
  document: Document;
  windowObject: Window & typeof globalThis;
  status: {
    prev: number | null;
    next: number | null;
    ctg: number | null;
    current: number | null;
    volume: number | null;
    shuffle?: MediaItem[] | null;
    media?: MediaItem[] | null;
    order: 'random' | 'normal';
    playertype: string | null;
    options: Record<string, unknown>;
  };
  selectors: {
    playlistSelect: HTMLSelectElement | null;
    categorySelect: HTMLSelectElement | null;
    languageSelect: HTMLSelectElement | null;
  };
  playlist: {
    listElement: HTMLElement;
    getPlaylistMode(): PlaylistMode;
    clearDeleteSelections(): void;
    resetReorderState(): void;
    clearMediaEditContext(): void;
    updatePlaylistModeUi(): void;
    updatePlaylist(): void;
    deleteSelectedIds: Set<number>;
    syncDeleteSelectionIndicator(itemElm: HTMLElement, selected: boolean): void;
    isPlaylistInteractionLocked(): boolean;
    openDescriptionModal(payload: {
      titleText: string;
      artistText: string;
      descText: string;
      trigger: HTMLElement;
    }): void;
    getDescriptionPayload(target: HTMLElement | null): {
      titleText: string;
      artistText: string;
      descText: string;
      trigger: HTMLElement;
    } | null;
    resolveMediaItem(amId: number): MediaItem | null;
    openMediaEditModal(item: MediaItem, trigger: HTMLElement): void;
    loadPlaylist(playlist: string): void;
    applyCategoryChange(newCtgId: number): void;
    canDiscardEditMode(): boolean;
    hideMediaEditModal(): void;
    resetPlaylistMode(): void;
  };
  playerControls: {
    carouselPrevButton: HTMLButtonElement | null;
    carouselNextButton: HTMLButtonElement | null;
    refreshButton: HTMLButtonElement | null;
    windowFullButton: HTMLButtonElement | null;
    windowFullToggle: HTMLInputElement | null;
    menuCollapseButton: HTMLButtonElement | null;
    playButton: HTMLButtonElement | null;
    pauseButton: HTMLButtonElement | null;
    menuElement: HTMLElement | null;
    playItem(target: HTMLElement): void;
    playItemById(playId: number): void;
    isFullWindowMode(): boolean;
    setFullWindowMode(enabled: boolean, forceApply?: boolean, persist?: boolean): void;
    setMenuMinimized(minimized: boolean): void;
    getPlayer(): {
      getPlayerState(): number;
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
    } | null | undefined;
  };
  settingsControlRoots: {
    loop: HTMLElement | null;
    randomly: HTMLElement | null;
    shuffle: HTMLElement | null;
    seekplay: HTMLElement | null;
    fader: HTMLElement | null;
    darkmode: HTMLElement | null;
  };
  settings: {
    volumeRange: HTMLInputElement | null;
    shufflePlaylist(): MediaItem[];
    persistMyPlaylistIfNeeded(): void;
    normalizeVolume(value: unknown): number;
    syncRangeProgress(range: HTMLInputElement | null): void;
    isDarkModeEnabled(): boolean;
    setStyles(targetElements: HTMLElement | HTMLElement[], styles?: string | Record<string, string>): void;
  };
  getCurrentPlaylist(): string | null;
  getCurrentCategoryId(): number | null;
  getCookie(key: string): string | null;
  updateCookie(key: string, value: string, days?: number | null): void;
  logger(...args: unknown[]): void;
}

export function initializeAppControlsRuntime(options: InitializeAppControlsRuntimeOptions): void {
  bindAmbientAppControlBindings({
    selectorControls: {
      playlistSelect: options.selectors.playlistSelect,
      categorySelect: options.selectors.categorySelect,
      languageSelect: options.selectors.languageSelect,
      getCurrentPlaylist: options.getCurrentPlaylist,
      getCurrentCategoryId: options.getCurrentCategoryId,
      getPlaylistMode: options.playlist.getPlaylistMode,
      canDiscardEditMode: options.playlist.canDiscardEditMode,
      clearDeleteSelections: options.playlist.clearDeleteSelections,
      resetReorderState: options.playlist.resetReorderState,
      hideMediaEditModal: options.playlist.hideMediaEditModal,
      clearMediaEditContext: options.playlist.clearMediaEditContext,
      resetPlaylistMode: options.playlist.resetPlaylistMode,
      updatePlaylistModeUi: options.playlist.updatePlaylistModeUi,
      loadPlaylist: options.playlist.loadPlaylist,
      applyCategoryChange: options.playlist.applyCategoryChange,
      updatePlaylist: options.playlist.updatePlaylist,
      getCookie: options.getCookie,
      updateCookie: options.updateCookie,
      logger: options.logger,
      reloadPage: () => {
        options.windowObject.location.reload();
      },
    },
    playlistInteractionControls: {
      listElement: options.playlist.listElement,
      getDescriptionPayload: options.playlist.getDescriptionPayload,
      openDescriptionModal: options.playlist.openDescriptionModal,
      getPlaylistMode: options.playlist.getPlaylistMode,
      deleteSelectedIds: options.playlist.deleteSelectedIds,
      syncDeleteSelectionIndicator: options.playlist.syncDeleteSelectionIndicator,
      resolveMediaItem: options.playlist.resolveMediaItem,
      openMediaEditModal: options.playlist.openMediaEditModal,
      isPlaylistInteractionLocked: options.playlist.isPlaylistInteractionLocked,
      playItem: options.playerControls.playItem,
      showPlayingState: () => {
        options.playerControls.playButton?.classList.add('hidden');
        options.playerControls.pauseButton?.classList.remove('hidden');
      },
    },
    playerControls: {
      carouselPrevButton: options.playerControls.carouselPrevButton,
      carouselNextButton: options.playerControls.carouselNextButton,
      refreshButton: options.playerControls.refreshButton,
      windowFullButton: options.playerControls.windowFullButton,
      windowFullToggle: options.playerControls.windowFullToggle,
      menuCollapseButton: options.playerControls.menuCollapseButton,
      playButton: options.playerControls.playButton,
      pauseButton: options.playerControls.pauseButton,
      menuElement: options.playerControls.menuElement,
      getPreviousId: () => options.status.prev,
      getNextId: () => options.status.next,
      playItemById: options.playerControls.playItemById,
      reloadPage: () => {
        options.windowObject.location.reload();
      },
      isFullWindowMode: options.playerControls.isFullWindowMode,
      setFullWindowMode: options.playerControls.setFullWindowMode,
      setMenuMinimized: options.playerControls.setMenuMinimized,
      getPlayertype: () => options.status.playertype,
      getPlayer: options.playerControls.getPlayer,
      logger: options.logger,
      getMediaItems: () => options.status.media || [],
      getCategoryId: () => options.status.ctg,
      isShuffleEnabled: () => Boolean(options.status.options?.shuffle),
      getShuffleItems: () => options.status.shuffle || [],
      getCurrentId: () => options.status.current,
      getOrder: () => options.status.order,
    },
    settingsControlRoots: options.settingsControlRoots,
    settingsControls: {
      volumeRange: options.settings.volumeRange,
      status: options.status,
      shufflePlaylist: options.settings.shufflePlaylist,
      persistMyPlaylistIfNeeded: options.settings.persistMyPlaylistIfNeeded,
      normalizeVolume: options.settings.normalizeVolume,
      syncRangeProgress: options.settings.syncRangeProgress,
      getDefaultVolumeDisplay: () => options.document.getElementById('default-volume-value') as HTMLElement | null,
      isDarkModeEnabled: options.settings.isDarkModeEnabled,
      setStyles: options.settings.setStyles,
    },
  });
}
