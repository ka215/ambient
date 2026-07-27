import { resetPlaylistRuntimeStatus, type PlaylistLoadGuard } from '../domain/playlist-loader';

export interface InitializePlaylistSessionOptions {
  status: {
    playlist: string | null;
  };
  playlistLoadGuard: PlaylistLoadGuard;
  myPlaylistName: string;
  getRuntimeAmbientData(): { isCloud?: boolean } | null | undefined;
  applyCloudEditRestrictions(): void;
  setPlaylistReadyState(isReady: boolean): void;
  clearCategory(): void;
  updatePlaylist(): void;
  generatePlaylistJson(seekFormat: boolean): string;
  writeMyPlaylistJson(json: string): void;
  logger(...args: unknown[]): void;
}

export function initializePlaylistSession(options: InitializePlaylistSessionOptions): {
  isPlaylistLoadActive(seq: number): boolean;
  beginPlaylistLoad(playlist: string): number;
  finishPlaylistLoad(seq: number): void;
  resetPlaylistRuntimeState(preserveOptions?: boolean): void;
  saveMyPlaylistToStorage(): boolean;
  persistMyPlaylistIfNeeded(): boolean;
} {
  const isPlaylistLoadActive = (seq: number): boolean => {
    return options.playlistLoadGuard.isActive(seq);
  };

  const beginPlaylistLoad = (playlist: string): number => {
    options.setPlaylistReadyState(false);
    return options.playlistLoadGuard.begin(playlist, (nextPlaylist) => {
      options.status.playlist = nextPlaylist;
      options.applyCloudEditRestrictions();
    });
  };

  const finishPlaylistLoad = (seq: number): void => {
    options.playlistLoadGuard.finish(seq);
  };

  const resetPlaylistRuntimeState = (preserveOptions = false): void => {
    resetPlaylistRuntimeStatus(options.status as any, preserveOptions);
    options.clearCategory();
    options.updatePlaylist();
    options.setPlaylistReadyState(false);
  };

  const saveMyPlaylistToStorage = (): boolean => {
    try {
      const jsonStr = options.generatePlaylistJson(false);
      options.writeMyPlaylistJson(jsonStr);
      options.logger('saveMyPlaylistToStorage: saved', jsonStr.length, 'bytes');
      return true;
    } catch (error) {
      options.logger('saveMyPlaylistToStorage: error', error);
      return false;
    }
  };

  const persistMyPlaylistIfNeeded = (): boolean => {
    const ambientData = options.getRuntimeAmbientData();
    if (options.playlistLoadGuard.isLoading()) {
      options.logger('persistMyPlaylistIfNeeded: skipped while playlist load is active');
      return false;
    }
    if (ambientData?.isCloud && options.status.playlist === options.myPlaylistName) {
      return saveMyPlaylistToStorage();
    }
    return true;
  };

  return {
    isPlaylistLoadActive,
    beginPlaylistLoad,
    finishPlaylistLoad,
    resetPlaylistRuntimeState,
    saveMyPlaylistToStorage,
    persistMyPlaylistIfNeeded,
  };
}
