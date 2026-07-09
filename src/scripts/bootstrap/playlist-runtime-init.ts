import type { MediaItem } from '../types/ambient';
import {
  fetchAmbientPlaylistData,
  initAmbientMyPlaylistFromStorage,
  loadAmbientMyPlaylistFromStorage,
  removeAmbientMyPlaylistOption,
} from './playlist-load-bindings';
import { ensureMyPlaylistOptionFromStorage as ensureMyPlaylistOptionFromStorageBootstrap } from './playlist-startup';

export interface InitializePlaylistRuntimeOptions {
  status: {
    options: Record<string, unknown> | null;
    category: string[] | null;
    media: MediaItem[] | null;
    playlist: string | null;
    current: number | null;
    ctg?: number | null;
  };
  ambientData: { isCloud?: boolean } | null | undefined;
  myPlaylistName: string;
  hasStoredMyPlaylist(): boolean;
  selectElement: HTMLSelectElement | null;
  sanitizeMediaItem<T extends Partial<MediaItem>>(item: T): T;
  applyPendingCategoryResume(): void;
  applyPendingMediaResume(): boolean;
  updatePlaylist(): void;
  updatePlayStatus(amId: number): void;
  getDefaultMediaItemForCurrentView(): MediaItem | null;
  logger(...args: unknown[]): void;
  resetPlaylistRuntimeState(preserveOptions?: boolean): void;
  selectPlaylistOption(playlist: string): void;
  applyCloudEditRestrictions(): void;
  setPlaylistReadyState(isReady: boolean): void;
  beginPlaylistLoad(playlist: string): number;
  isPlaylistLoadActive(seq: number): boolean;
  finishPlaylistLoad(seq: number): void;
  releaseAppBootGate(): void;
  fetchData(url: string): Promise<unknown>;
  baseUrl: string;
}

export function initializePlaylistRuntime(options: InitializePlaylistRuntimeOptions): {
  loadMyPlaylistFromStorage(): boolean;
  ensureMyPlaylistOptionFromStorage(): boolean;
  initMyPlaylistFromStorage(): void;
  getPlaylistData(playlist: string, preserveOptionsDuringLoad?: boolean): Promise<void>;
} {
  const loadMyPlaylistFromStorage = (): boolean => {
    return loadAmbientMyPlaylistFromStorage({
      status: options.status,
      myPlaylistName: options.myPlaylistName,
      sanitizeMediaItem: options.sanitizeMediaItem,
      applyPendingCategoryResume: options.applyPendingCategoryResume,
      applyPendingMediaResume: options.applyPendingMediaResume,
      updatePlaylist: options.updatePlaylist,
      updatePlayStatus: options.updatePlayStatus,
      getDefaultMediaItemForCurrentView: options.getDefaultMediaItemForCurrentView,
      logger: options.logger,
    });
  };

  const ensureMyPlaylistOptionFromStorage = (): boolean => {
    return ensureMyPlaylistOptionFromStorageBootstrap({
      hasStoredMyPlaylist: options.hasStoredMyPlaylist(),
      isCloud: options.ambientData?.isCloud === true,
      myPlaylistName: options.myPlaylistName,
      selectElement: options.selectElement,
    });
  };

  const initMyPlaylistFromStorage = (): void => {
    initAmbientMyPlaylistFromStorage({
      ensureMyPlaylistOptionFromStorage,
      resetPlaylistRuntimeState: () => {
        options.resetPlaylistRuntimeState();
      },
      loadMyPlaylistFromStorage,
      selectPlaylistOption: options.selectPlaylistOption,
      myPlaylistName: options.myPlaylistName,
      applyCloudEditRestrictions: options.applyCloudEditRestrictions,
      removePlaylistOption: () => {
        removeAmbientMyPlaylistOption(options.selectElement, options.myPlaylistName);
      },
      clearCurrentPlaylist: () => {
        options.status.playlist = null;
      },
      setPlaylistReadyState: options.setPlaylistReadyState,
    });
  };

  const getPlaylistData = async (playlist: string, preserveOptionsDuringLoad = false): Promise<void> => {
    await fetchAmbientPlaylistData({
      playlist,
      preserveOptionsDuringLoad,
      myPlaylistName: options.myPlaylistName,
      beginPlaylistLoad: options.beginPlaylistLoad,
      resetPlaylistRuntimeState: options.resetPlaylistRuntimeState,
      loadMyPlaylistFromStorage,
      isPlaylistLoadActive: options.isPlaylistLoadActive,
      clearCurrentPlaylist: () => {
        options.status.playlist = null;
      },
      applyCloudEditRestrictions: options.applyCloudEditRestrictions,
      fetchData: options.fetchData,
      baseUrl: options.baseUrl,
      status: options.status,
      applyPendingCategoryResume: options.applyPendingCategoryResume,
      applyPendingMediaResume: options.applyPendingMediaResume,
      updatePlaylist: options.updatePlaylist,
      updatePlayStatus: options.updatePlayStatus,
      getDefaultMediaItemForCurrentView: options.getDefaultMediaItemForCurrentView,
      finishPlaylistLoad: options.finishPlaylistLoad,
      releaseAppBootGate: options.releaseAppBootGate,
    });
  };

  return {
    loadMyPlaylistFromStorage,
    ensureMyPlaylistOptionFromStorage,
    initMyPlaylistFromStorage,
    getPlaylistData,
  };
}
