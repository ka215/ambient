import type { MediaItem, PlaylistData } from '../types/ambient';
import {
  assignSequentialMediaIds,
  materializeCategorizedMedia,
  normalizePlaylistData,
} from '../domain/playlist-loader';
import {
  parseStoredMyPlaylist,
  readMyPlaylistJson,
} from '../domain/myplaylist-storage';
import { removeMyPlaylistOption } from './playlist-startup';

export function loadAmbientMyPlaylistFromStorage(options: {
  status: {
    options: Record<string, unknown> | null;
    category: string[] | null;
    media: MediaItem[] | null;
    playlist: string | null;
    current: number | null;
  };
  myPlaylistName: string;
  sanitizeMediaItem<T extends Partial<MediaItem>>(item: T): T;
  applyPendingCategoryResume(): void;
  applyPendingMediaResume(): boolean;
  updatePlaylist(): void;
  updatePlayStatus(amId: number): void;
  getDefaultMediaItemForCurrentView(): MediaItem | null;
  logger: (...args: unknown[]) => void;
}): boolean {
  const raw = readMyPlaylistJson();
  if (!raw) {
    return false;
  }

  try {
    const storedPlaylist = parseStoredMyPlaylist({
      raw,
      sanitizeMediaItem: options.sanitizeMediaItem,
    });
    if (!storedPlaylist) {
      options.logger('loadMyPlaylistFromStorage: invalid schema');
      return false;
    }

    const materialized = materializeCategorizedMedia(storedPlaylist.mediaByCategory);
    const categories = materialized.categories;
    let media = materialized.media;

    if (media.length > 0) {
      media = assignSequentialMediaIds(media);
    }

    options.status.options = storedPlaylist.options as Record<string, unknown> | null;
    options.status.category = categories;
    options.status.media = media;
    options.status.playlist = options.myPlaylistName;
    options.applyPendingCategoryResume();
    options.updatePlaylist();
    if (options.applyPendingMediaResume()) {
      // restored without autoplay
    } else if (options.status.current !== null) {
      options.updatePlayStatus(options.status.current);
    } else if (media.length > 0) {
      options.updatePlayStatus(options.getDefaultMediaItemForCurrentView()?.amId ?? 0);
    }
    options.logger('loadMyPlaylistFromStorage: loaded', media.length, 'items');
    return true;
  } catch (error) {
    options.logger('loadMyPlaylistFromStorage: parse error', error);
    return false;
  }
}

export function initAmbientMyPlaylistFromStorage(options: {
  ensureMyPlaylistOptionFromStorage(): boolean;
  resetPlaylistRuntimeState(): void;
  loadMyPlaylistFromStorage(): boolean;
  selectPlaylistOption(playlist: string): void;
  myPlaylistName: string;
  applyCloudEditRestrictions(): void;
  removePlaylistOption(): void;
  clearCurrentPlaylist(): void;
  setPlaylistReadyState(isReady: boolean): void;
}): void {
  if (!options.ensureMyPlaylistOptionFromStorage()) {
    return;
  }
  options.resetPlaylistRuntimeState();
  if (options.loadMyPlaylistFromStorage()) {
    options.selectPlaylistOption(options.myPlaylistName);
    options.applyCloudEditRestrictions();
    return;
  }
  options.removePlaylistOption();
  options.clearCurrentPlaylist();
  options.applyCloudEditRestrictions();
  options.setPlaylistReadyState(true);
}

export async function fetchAmbientPlaylistData(options: {
  playlist: string;
  preserveOptionsDuringLoad: boolean;
  myPlaylistName: string;
  beginPlaylistLoad(playlist: string): number;
  resetPlaylistRuntimeState(preserveOptions: boolean): void;
  loadMyPlaylistFromStorage(): boolean;
  isPlaylistLoadActive(seq: number): boolean;
  clearCurrentPlaylist(): void;
  applyCloudEditRestrictions(): void;
  fetchData(url: string): Promise<unknown>;
  baseUrl: string;
  status: {
    options: Record<string, unknown> | null;
    category: string[] | null;
    media: MediaItem[] | null;
    playlist: string | null;
    current: number | null;
  };
  applyPendingCategoryResume(): void;
  applyPendingMediaResume(): boolean;
  updatePlaylist(): void;
  updatePlayStatus(amId: number): void;
  getDefaultMediaItemForCurrentView(): MediaItem | null;
  finishPlaylistLoad(seq: number): void;
  releaseAppBootGate(): void;
}): Promise<void> {
  const loadSeq = options.beginPlaylistLoad(options.playlist);
  options.resetPlaylistRuntimeState(options.preserveOptionsDuringLoad);
  try {
    if (options.playlist === options.myPlaylistName) {
      const loaded = options.loadMyPlaylistFromStorage();
      if (!options.isPlaylistLoadActive(loadSeq)) {
        return;
      }
      if (!loaded) {
        options.clearCurrentPlaylist();
      }
      options.applyCloudEditRestrictions();
      return;
    }

    const endpointURL = `${options.baseUrl}playlist/${options.playlist}`;
    const response = await options.fetchData(endpointURL);
    if (!options.isPlaylistLoadActive(loadSeq)) {
      return;
    }
    if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
      const data = (response as { data: PlaylistData }).data;
      const normalized = normalizePlaylistData(data);
      options.status.options = normalized.options as Record<string, unknown> | null;
      options.status.category = normalized.categories;
      options.status.media = normalized.media;
      options.status.playlist = options.playlist;
      options.applyPendingCategoryResume();
      options.updatePlaylist();
      if (options.applyPendingMediaResume()) {
        // restored without autoplay
      } else if (options.status.current !== null) {
        options.updatePlayStatus(options.status.current);
      } else if (normalized.media.length > 0) {
        options.updatePlayStatus(options.getDefaultMediaItemForCurrentView()?.amId ?? 0);
      }
    }
    options.applyCloudEditRestrictions();
  } finally {
    options.finishPlaylistLoad(loadSeq);
    options.releaseAppBootGate();
  }
}

export function removeAmbientMyPlaylistOption(selectElement: HTMLSelectElement | null, myPlaylistName: string): void {
  removeMyPlaylistOption(selectElement, myPlaylistName);
}
