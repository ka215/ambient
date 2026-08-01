import type { MediaItem } from '../types/ambient';
import type { CategoryMutationReason } from './playlist-management-data';

function resolveCategoryMutationMessage(options: {
  reason?: CategoryMutationReason;
  failureMessage: string;
  duplicateMessage: string;
  notEmptyMessage: string;
  requiredMessage: string;
}): string {
  switch (options.reason) {
    case 'duplicate':
      return options.duplicateMessage;
    case 'not-empty':
      return options.notEmptyMessage;
    case 'empty-name':
      return options.requiredMessage;
    default:
      return options.failureMessage;
  }
}

export function createPlaylistCategoryAction(options: {
  form: HTMLFormElement | null;
  categories: string[];
  successMessage: string;
  failureMessage: string;
  appendCategory: (categories: string[], categoryName: string) => { categories: string[] };
  persist: () => boolean | Promise<boolean>;
  onCategoriesUpdated: (categories: string[]) => void;
  onAfterSuccess: () => void;
  logger: (...args: unknown[]) => void;
}): Promise<{ ok: boolean; message: string }> {
  if (!options.form) {
    return Promise.resolve({
      ok: false,
      message: options.failureMessage,
    });
  }
  const form = options.form;

  return (async () => {
    const formData = new FormData(form);
    const categoryName = String(formData.get('category_name') || '');
    const result = options.appendCategory(options.categories, categoryName);
    options.onCategoriesUpdated(result.categories);
    options.logger('createCategory:', categoryName, result.categories);
    const persisted = await options.persist();
    if (persisted) {
      options.onAfterSuccess();
    }
    return {
      ok: persisted,
      message: persisted ? options.successMessage : options.failureMessage,
    };
  })().catch((error) => {
    options.logger('createCategory: error', error);
    return {
      ok: false,
      message: options.failureMessage,
    };
  });
}

export function renamePlaylistCategoryAction(options: {
  categories: string[];
  categoryIndex: number;
  categoryName: string;
  successMessage: string;
  failureMessage: string;
  duplicateMessage: string;
  requiredMessage: string;
  renameCategory: (categories: string[], currentIndex: number, nextName: string) => {
    ok: boolean;
    categories: string[];
    reason?: CategoryMutationReason;
  };
  persist: () => boolean | Promise<boolean>;
  onCategoriesUpdated: (categories: string[]) => void;
  onAfterSuccess: () => void;
  logger: (...args: unknown[]) => void;
}): Promise<{ ok: boolean; message: string }> {
  return (async () => {
    const result = options.renameCategory(options.categories, options.categoryIndex, options.categoryName);
    if (!result.ok) {
      return {
        ok: false,
        message: resolveCategoryMutationMessage({
          reason: result.reason,
          failureMessage: options.failureMessage,
          duplicateMessage: options.duplicateMessage,
          notEmptyMessage: options.failureMessage,
          requiredMessage: options.requiredMessage,
        }),
      };
    }

    options.onCategoriesUpdated(result.categories);
    options.logger('renameCategory:', options.categoryIndex, options.categoryName, result.categories);
    const persisted = await options.persist();
    if (persisted) {
      options.onAfterSuccess();
    }
    return {
      ok: persisted,
      message: persisted ? options.successMessage : options.failureMessage,
    };
  })().catch((error) => {
    options.logger('renameCategory: error', error);
    return {
      ok: false,
      message: options.failureMessage,
    };
  });
}

export function deletePlaylistCategoryAction(options: {
  categories: string[];
  mediaItems: MediaItem[];
  categoryIndex: number;
  successMessage: string;
  failureMessage: string;
  notEmptyMessage: string;
  deleteCategory: (categories: string[], mediaItems: MediaItem[], currentIndex: number) => {
    ok: boolean;
    categories: string[];
    mediaItems?: MediaItem[];
    reason?: CategoryMutationReason;
  };
  persist: () => boolean | Promise<boolean>;
  onCategoriesUpdated: (categories: string[]) => void;
  onMediaItemsUpdated: (mediaItems: MediaItem[]) => void;
  onAfterSuccess: () => void;
  logger: (...args: unknown[]) => void;
}): Promise<{ ok: boolean; message: string }> {
  return (async () => {
    const result = options.deleteCategory(options.categories, options.mediaItems, options.categoryIndex);
    if (!result.ok) {
      return {
        ok: false,
        message: resolveCategoryMutationMessage({
          reason: result.reason,
          failureMessage: options.failureMessage,
          duplicateMessage: options.failureMessage,
          notEmptyMessage: options.notEmptyMessage,
          requiredMessage: options.failureMessage,
        }),
      };
    }

    options.onCategoriesUpdated(result.categories);
    options.onMediaItemsUpdated(result.mediaItems || options.mediaItems);
    options.logger('deleteCategory:', options.categoryIndex, result.categories);
    const persisted = await options.persist();
    if (persisted) {
      options.onAfterSuccess();
    }
    return {
      ok: persisted,
      message: persisted ? options.successMessage : options.failureMessage,
    };
  })().catch((error) => {
    options.logger('deleteCategory: error', error);
    return {
      ok: false,
      message: options.failureMessage,
    };
  });
}

export function downloadPlaylistAction(options: {
  form: HTMLFormElement | null;
  playlistName: string;
  successMessage: string;
  failureMessage: string;
  generatePlaylistJson: (seekFormat: boolean) => string;
}): { ok: boolean; message: string } {
  if (!options.form) {
    return {
      ok: false,
      message: options.failureMessage,
    };
  }

  const formData = new FormData(options.form);
  const seekFormat = Number(formData.get('seek_format')) === 1;
  const jsonContent = options.generatePlaylistJson(seekFormat);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const downloadName = options.playlistName || 'playlist';
  anchor.download = /\.json$/i.test(downloadName) ? downloadName : `${downloadName}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return {
    ok: true,
    message: options.successMessage,
  };
}

export async function importPlaylistFromManagementAction(options: {
  fileInput: HTMLInputElement | null;
  successMessage: string;
  failureMessage: string;
  noFileMessage: string;
  importPlaylistFromFile: (file: File) => Promise<{ ok: boolean; message: string }>;
  onImportSuccess: () => void;
}): Promise<{ ok: boolean; message: string }> {
  const importFile = options.fileInput?.files && options.fileInput.files.length > 0
    ? options.fileInput.files[0]
    : null;

  if (!importFile) {
    return {
      ok: false,
      message: options.noFileMessage,
    };
  }

  const result = await options.importPlaylistFromFile(importFile);
  if (result.ok) {
    options.onImportSuccess();
  }

  return {
    ok: result.ok,
    message: result.message || (result.ok ? options.successMessage : options.failureMessage),
  };
}
