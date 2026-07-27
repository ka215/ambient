import type { MediaItem } from '../types/ambient';
import { getMediaCategoryName as getMediaCategoryNameState } from '../state/playlist-mode-state';

export interface CreateMediaEditRuntimeSupportOptions {
  status: AMP_STATUS;
  getOption(key: string): unknown;
  persistCloudPlaylist(): boolean;
  generatePlaylistJson(pretty?: boolean): string;
  updatePlayStatus(amId: number): void;
  confirm(message: string): boolean;
}

export interface MediaEditRuntimeSupport {
  getOption(key: string): unknown;
  persistCloudPlaylist(): boolean;
  generatePlaylistJson(pretty?: boolean): string;
  updatePlayStatus(amId: number): void;
  getMediaCategoryName(mediaItem: MediaItem): string;
  confirm(message: string): boolean;
}

export function createMediaEditRuntimeSupport(
  options: CreateMediaEditRuntimeSupportOptions
): MediaEditRuntimeSupport {
  return {
    getOption: options.getOption,
    persistCloudPlaylist: options.persistCloudPlaylist,
    generatePlaylistJson: options.generatePlaylistJson,
    updatePlayStatus: options.updatePlayStatus,
    getMediaCategoryName: (mediaItem) => getMediaCategoryNameState(mediaItem, options.status.category),
    confirm: options.confirm,
  };
}
