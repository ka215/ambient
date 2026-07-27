import type { MediaItem } from '../types/ambient';
import { selectExistingOption } from '../ui/forms/management-forms';
import { initializePlaylistRuntime } from './playlist-runtime-init';

export interface InitializePlaylistRuntimeWiringOptions {
  status: {
    options: Record<string, unknown> | null;
    category: string[] | null;
    media: MediaItem[] | null;
    playlist: string | null;
    current: number | null;
    ctg?: number | null;
  };
  ambientData: { isCloud?: boolean } | null;
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
  applyCloudEditRestrictions(): void;
  setPlaylistReadyState(isReady: boolean): void;
  beginPlaylistLoad(playlist: string): number;
  isPlaylistLoadActive(seq: number): boolean;
  finishPlaylistLoad(seq: number): void;
  releaseAppBootGate(): void;
  fetchData(url: string): Promise<unknown>;
  baseUrl: string;
}

export function initializePlaylistRuntimeWiring(options: InitializePlaylistRuntimeWiringOptions) {
  return initializePlaylistRuntime({
    status: options.status,
    ambientData: options.ambientData,
    myPlaylistName: options.myPlaylistName,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    selectElement: options.selectElement,
    sanitizeMediaItem: options.sanitizeMediaItem,
    applyPendingCategoryResume: options.applyPendingCategoryResume,
    applyPendingMediaResume: options.applyPendingMediaResume,
    updatePlaylist: options.updatePlaylist,
    updatePlayStatus: options.updatePlayStatus,
    getDefaultMediaItemForCurrentView: options.getDefaultMediaItemForCurrentView,
    logger: options.logger,
    resetPlaylistRuntimeState: options.resetPlaylistRuntimeState,
    selectPlaylistOption: (playlist) => {
      selectExistingOption(options.selectElement, playlist);
    },
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    setPlaylistReadyState: options.setPlaylistReadyState,
    beginPlaylistLoad: options.beginPlaylistLoad,
    isPlaylistLoadActive: options.isPlaylistLoadActive,
    finishPlaylistLoad: options.finishPlaylistLoad,
    releaseAppBootGate: options.releaseAppBootGate,
    fetchData: options.fetchData,
    baseUrl: options.baseUrl,
  });
}
