export function createPlaylistCategoryAction(options: {
  form: HTMLFormElement | null;
  categories: string[];
  successMessage: string;
  failureMessage: string;
  appendCategory: (categories: string[], categoryName: string) => { categories: string[] };
  persist: () => boolean;
  onCategoriesUpdated: (categories: string[]) => void;
  onAfterSuccess: () => void;
  logger: (...args: unknown[]) => void;
}): { ok: boolean; message: string } {
  if (!options.form) {
    return {
      ok: false,
      message: options.failureMessage,
    };
  }

  try {
    const formData = new FormData(options.form);
    const categoryName = String(formData.get('category_name') || '');
    const result = options.appendCategory(options.categories, categoryName);
    options.onCategoriesUpdated(result.categories);
    options.logger('createCategory:', categoryName, result.categories);
    const persisted = options.persist();
    options.onAfterSuccess();
    return {
      ok: persisted,
      message: persisted ? options.successMessage : options.failureMessage,
    };
  } catch (error) {
    options.logger('createCategory: error', error);
    return {
      ok: false,
      message: options.failureMessage,
    };
  }
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
  anchor.download = options.playlistName || 'playlist.json';
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
