import type { MediaItem } from '../types/ambient';

export interface PlaylistSelectionHandlerOptions {
  getCurrentPlaylist: () => string | null;
  getPlaylistMode: () => string;
  canDiscardEditMode: () => boolean;
  clearDeleteSelections: () => void;
  resetReorderState: () => void;
  hideMediaEditModal: () => void;
  clearMediaEditContext: () => void;
  resetPlaylistMode: () => void;
  updatePlaylistModeUi: () => void;
  loadPlaylist: (playlist: string) => void;
}

export function handlePlaylistSelectionChange(
  event: Event,
  options: PlaylistSelectionHandlerOptions
): void {
  const selectElm = event.target as HTMLSelectElement;
  const oldPlaylist = options.getCurrentPlaylist();
  const newPlaylist = selectElm.value;
  const previousSelectedPlaylist = selectElm.dataset['ambientSelectedPlaylist'] || oldPlaylist || '';
  if (oldPlaylist === newPlaylist && previousSelectedPlaylist === newPlaylist) {
    return;
  }

  const playlistMode = options.getPlaylistMode();
  if (playlistMode !== 'normal') {
    if (playlistMode === 'edit' && !options.canDiscardEditMode()) {
      selectElm.value = oldPlaylist || '';
      selectElm.dataset['ambientSelectedPlaylist'] = oldPlaylist || '';
      return;
    }
    options.clearDeleteSelections();
    options.resetReorderState();
    if (playlistMode === 'edit') {
      options.hideMediaEditModal();
      options.clearMediaEditContext();
    }
    options.resetPlaylistMode();
    options.updatePlaylistModeUi();
  }

  selectElm.dataset['ambientSelectedPlaylist'] = newPlaylist;
  options.loadPlaylist(newPlaylist);
}

export interface CategorySelectionHandlerOptions {
  getCurrentCategoryId: () => number | null;
  getPlaylistMode: () => string;
  canDiscardEditMode: () => boolean;
  clearDeleteSelections: () => void;
  resetReorderState: () => void;
  hideMediaEditModal: () => void;
  clearMediaEditContext: () => void;
  resetPlaylistMode: () => void;
  updatePlaylistModeUi: () => void;
  applyCategoryChange: (categoryId: number) => void;
  updatePlaylist: () => void;
}

export function handleCategorySelectionChange(
  event: Event,
  options: CategorySelectionHandlerOptions
): void {
  const selectElm = event.target as HTMLSelectElement;
  const oldCtgId = options.getCurrentCategoryId();
  const newCtgId = Number(selectElm.value);
  if (oldCtgId !== newCtgId) {
    const playlistMode = options.getPlaylistMode();
    if (playlistMode !== 'normal') {
      if (playlistMode === 'edit' && !options.canDiscardEditMode()) {
        selectElm.value = oldCtgId !== null ? String(oldCtgId) : '-1';
        return;
      }
      options.clearDeleteSelections();
      options.resetReorderState();
      if (playlistMode === 'edit') {
        options.hideMediaEditModal();
        options.clearMediaEditContext();
      }
      options.resetPlaylistMode();
      options.updatePlaylistModeUi();
    }
    options.applyCategoryChange(newCtgId);
  }
  options.updatePlaylist();
}

export interface PlaylistItemActivationHandlerOptions {
  getPlaylistMode: () => string;
  deleteSelectedIds: Set<number>;
  syncDeleteSelectionIndicator: (itemElm: HTMLElement, selected: boolean) => void;
  resolveMediaItem: (amId: number) => MediaItem | null;
  openMediaEditModal: (mediaItem: MediaItem, trigger: HTMLElement) => void;
  isPlaylistInteractionLocked: () => boolean;
  playItem: (itemElm: HTMLElement) => void;
  showPlayingState: () => void;
}

export function handlePlaylistItemActivation(
  itemElm: HTMLElement,
  event: Event,
  options: PlaylistItemActivationHandlerOptions
): void {
  event.preventDefault();
  const playlistMode = options.getPlaylistMode();
  if (playlistMode === 'delete') {
    const amId = Number(itemElm.getAttribute('data-playlist-item'));
    if (options.deleteSelectedIds.has(amId)) {
      options.deleteSelectedIds.delete(amId);
    } else {
      options.deleteSelectedIds.add(amId);
    }
    options.syncDeleteSelectionIndicator(itemElm, options.deleteSelectedIds.has(amId));
    return;
  }
  if (playlistMode === 'edit') {
    const amId = Number(itemElm.getAttribute('data-playlist-item'));
    const mediaItem = options.resolveMediaItem(amId);
    if (mediaItem) {
      options.openMediaEditModal(mediaItem, itemElm);
    }
    return;
  }
  if (options.isPlaylistInteractionLocked()) {
    return;
  }
  options.playItem(itemElm);
  options.showPlayingState();
}

export interface PlayerPlayHandlerOptions {
  playertype: string | null;
  player: {
    getPlayerState(): number;
    playVideo(): void;
  } | null | undefined;
  logger: (...args: unknown[]) => void;
  resolvePlayId: () => number | null;
  playItem: (id: number | null) => void;
  showPlayingState: () => void;
}

export function handlePlayerPlay(options: PlayerPlayHandlerOptions): void {
  const playId = options.resolvePlayId();

  if (options.playertype === 'youtube' && options.player) {
    const playerState = options.player.getPlayerState();
    options.logger('"Play" the YouTube Player:', playerState);
    if (playerState !== -1) {
      options.player.playVideo();
    }
  } else if (/^(audio|video)$/i.test(options.playertype || '')) {
    const playerElms = document.getElementsByTagName(options.playertype as string);
    const playerElm = playerElms[0] as HTMLMediaElement;
    playerElm.play();
  } else {
    options.playItem(playId);
  }

  options.showPlayingState();
}

export interface PlayerPauseHandlerOptions {
  playertype: string | null;
  player: {
    getPlayerState(): number;
    pauseVideo(): void;
    stopVideo(): void;
  } | null | undefined;
  showDisabledState: () => void;
  showPausedState: () => void;
}

export function handlePlayerPause(options: PlayerPauseHandlerOptions): void {
  if (!options.playertype) {
    return;
  }
  if (options.playertype === 'youtube' && options.player) {
    if (options.player.getPlayerState() === 1) {
      options.player.pauseVideo();
    } else {
      options.player.stopVideo();
    }
  } else if (/^(audio|video)$/i.test(options.playertype)) {
    const playerElms = document.getElementsByTagName(options.playertype as string);
    const playerElm = playerElms[0] as HTMLMediaElement;
    playerElm.pause();
  } else {
    options.showDisabledState();
  }

  options.showPausedState();
}
