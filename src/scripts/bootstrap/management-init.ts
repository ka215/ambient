import { bindMediaManagementForm } from '../ui/forms/media-management';
import { bindPlaylistManagementForm } from '../ui/forms/playlist-management';
import {
  buildMediaManagementBindings as buildMediaManagementBindingsView,
  buildPlaylistManagementBindings as buildPlaylistManagementBindingsView,
} from '../ui/forms/management-binding-builders';
import {
  createPlaylistCategoryAction,
  deletePlaylistCategoryAction,
  downloadPlaylistAction,
  importPlaylistFromManagementAction,
  renamePlaylistCategoryAction,
} from '../domain/playlist-management-actions';
import {
  appendUniqueCategory,
  deleteEmptyCategory,
  renameCategory,
} from '../domain/playlist-management-data';
import type { MediaItem } from '../types/ambient';

type MediaBindings = Parameters<typeof buildMediaManagementBindingsView>[0];
type PlaylistBindings = Parameters<typeof buildPlaylistManagementBindingsView>[0];

export interface ManagementFormInitOptions {
  mediaBindings: MediaBindings | null;
  playlistBindings: PlaylistBindings | null;
}

export function initializeManagementForms(options: ManagementFormInitOptions): void {
  if (options.mediaBindings) {
    bindMediaManagementForm(buildMediaManagementBindingsView(options.mediaBindings));
  }

  if (options.playlistBindings) {
    bindPlaylistManagementForm(buildPlaylistManagementBindingsView(options.playlistBindings));
  }
}

export function createPlaylistManagementActions(options: {
  form: HTMLFormElement | null;
  getCategories(): string[];
  getMediaItems(): MediaItem[];
  persistMyPlaylistIfNeeded(): boolean;
  setCategories(categories: string[]): void;
  setMediaItems(mediaItems: MediaItem[]): void;
  resetActiveCategory(): void;
  onCategoryCreated(): void;
  onCategoriesMutated(): void;
  logger(...args: unknown[]): void;
  getPlaylistName(): string;
  generatePlaylistJson(seekFormat: boolean): string;
  importFileInput: HTMLInputElement | null;
  importPlaylistFromFile(file: File): Promise<{ ok: boolean; message: string }>;
  hideOptionsModal(): void;
  getLocalizedMessage(key: string, fallback: string): string;
}): {
  createCategory(): { ok: boolean; message: string };
  downloadPlaylist(): { ok: boolean; message: string };
  importPlaylist(): Promise<{ ok: boolean; message: string }>;
  renameCategory(categoryIndex: number, categoryName: string): { ok: boolean; message: string };
  deleteCategory(categoryIndex: number): { ok: boolean; message: string };
} {
  return {
    createCategory: () => {
      const selfElm = document.getElementById('btn-create-category');
      return createPlaylistCategoryAction({
        form: options.form,
        categories: options.getCategories(),
        successMessage: selfElm?.dataset['messageSuccess'] || '',
        failureMessage: selfElm?.dataset['messageFailure'] || '',
        appendCategory: appendUniqueCategory,
        persist: options.persistMyPlaylistIfNeeded,
        onCategoriesUpdated: (categories) => {
          options.setCategories(categories);
        },
        onAfterSuccess: options.onCategoryCreated,
        logger: options.logger,
      });
    },
    downloadPlaylist: () => {
      const selfElm = document.getElementById('btn-download-playlist');
      return downloadPlaylistAction({
        form: options.form,
        playlistName: options.getPlaylistName(),
        successMessage: selfElm?.dataset['messageSuccess'] || '',
        failureMessage: selfElm?.dataset['messageFailure'] || '',
        generatePlaylistJson: options.generatePlaylistJson,
      });
    },
    importPlaylist: async () => {
      const selfElm = document.getElementById('btn-import-playlist') as HTMLButtonElement | null;
      return importPlaylistFromManagementAction({
        fileInput: options.importFileInput,
        successMessage: selfElm?.dataset['messageSuccess'] || '',
        failureMessage: selfElm?.dataset['messageFailure'] || '',
        noFileMessage: options.getLocalizedMessage('importNoFile', 'Please choose a playlist JSON file.'),
        importPlaylistFromFile: options.importPlaylistFromFile,
        onImportSuccess: options.hideOptionsModal,
      });
    },
    renameCategory: (categoryIndex, categoryName) => {
      const selfElm = document.getElementById('btn-update-category');
      return renamePlaylistCategoryAction({
        categories: options.getCategories(),
        categoryIndex,
        categoryName,
        successMessage: selfElm?.dataset['messageSuccess'] || '',
        failureMessage: selfElm?.dataset['messageFailure'] || '',
        duplicateMessage: selfElm?.dataset['messageDuplicate'] || '',
        requiredMessage: selfElm?.dataset['messageRequired'] || '',
        renameCategory,
        persist: options.persistMyPlaylistIfNeeded,
        onCategoriesUpdated: options.setCategories,
        onAfterSuccess: () => {
          options.resetActiveCategory();
          options.onCategoriesMutated();
        },
        logger: options.logger,
      });
    },
    deleteCategory: (categoryIndex) => {
      const selfElm = document.getElementById('btn-delete-category');
      return deletePlaylistCategoryAction({
        categories: options.getCategories(),
        mediaItems: options.getMediaItems(),
        categoryIndex,
        successMessage: selfElm?.dataset['messageSuccess'] || '',
        failureMessage: selfElm?.dataset['messageFailure'] || '',
        notEmptyMessage: selfElm?.dataset['messageNotEmpty'] || '',
        deleteCategory: deleteEmptyCategory,
        persist: options.persistMyPlaylistIfNeeded,
        onCategoriesUpdated: options.setCategories,
        onMediaItemsUpdated: options.setMediaItems,
        onAfterSuccess: () => {
          options.resetActiveCategory();
          options.onCategoriesMutated();
        },
        logger: options.logger,
      });
    },
  };
}
