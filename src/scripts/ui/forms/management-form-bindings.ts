import type { MediaItem } from '../../types/ambient';
import { appendManagedMediaItem, buildManagedMediaItem } from '../../domain/media-management-data';
import {
  resetMediaManagementForm,
  resetPlaylistManagementForm,
} from './management-forms';

export function createManagementFormBindings(options: {
  mediaForm: HTMLFormElement | null;
  mediaElements: HTMLElement[];
  playlistForm: HTMLFormElement | null;
  playlistElements: HTMLElement[];
  getAddType: () => string | null | undefined;
  syncMediaVolumeField: () => void;
  setValidated: (field: Element | null, valid: boolean | null) => void;
  logger: (...args: unknown[]) => void;
  ensureTargetPlaylist: () => void;
  getMediaItems: () => MediaItem[];
  getCategories: () => string[];
  setCategories: (categories: string[]) => void;
  setMediaItems: (mediaItems: MediaItem[]) => void;
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
  sanitizeMediaText: (value: string, maxLength: number) => string;
  sanitizeMediaDesc: (value: string, maxLength: number) => string;
  isVolumeInRange: (value: number) => boolean;
  generatePlaylistJson: (seekFormat: boolean) => string;
}): {
  resetMediaManageForm: () => void;
  addMediaData: (payload: [string, string][], preferredCategoryId?: number | null) => boolean;
  generatePlaylistJson: (seekFormat: boolean) => string;
  resetPlaylistManageForm: () => void;
} {
  function resetMediaManageForm(): void {
    resetMediaManagementForm({
      form: options.mediaForm,
      elements: options.mediaElements,
      addType: options.getAddType(),
      syncMediaVolumeField: options.syncMediaVolumeField,
      setValidated: options.setValidated,
    });
  }

  function addMediaData(payload: [string, string][], preferredCategoryId: number | null = null): boolean {
    options.logger('addMediaData::before:', payload, options.getMediaItems().length);
    options.ensureTargetPlaylist();
    const built = buildManagedMediaItem({
      payload,
      categories: options.getCategories(),
      preferredCategoryId,
      titleMaxLength: options.titleMaxLength,
      artistMaxLength: options.artistMaxLength,
      descMaxLength: options.descMaxLength,
      sanitizeMediaText: options.sanitizeMediaText,
      sanitizeMediaDesc: options.sanitizeMediaDesc,
      isVolumeInRange: options.isVolumeInRange,
    });
    options.setCategories(built.categories);
    options.setMediaItems(appendManagedMediaItem(options.getMediaItems(), built.mediaItem));
    options.logger('addMediaData::after:', options.getMediaItems().length);
    return true;
  }

  function generatePlaylistJson(seekFormat: boolean): string {
    const playlistJson = options.generatePlaylistJson(seekFormat);
    options.logger('generatePlaylistJson::after:', playlistJson);
    return playlistJson;
  }

  function resetPlaylistManageForm(): void {
    resetPlaylistManagementForm({
      form: options.playlistForm,
      elements: options.playlistElements,
      setValidated: options.setValidated,
      logger: options.logger,
    });
  }

  return {
    resetMediaManageForm,
    addMediaData,
    generatePlaylistJson,
    resetPlaylistManageForm,
  };
}
