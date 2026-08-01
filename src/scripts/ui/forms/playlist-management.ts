import { bindFileDropzone, setFileDropzoneState } from './file-dropzone';
import type { MediaItem } from '../../types/ambient';

export interface PlaylistManagementNotice {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  delay?: number;
}

export interface PlaylistManagementBindings {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  updateNotice(notification: PlaylistManagementNotice): void;
  resetPlaylistManagementForm(): void;
  fetchData(endpointURL: string, method?: string, payload?: Record<string, string>): Promise<unknown>;
  inArray(contains: unknown | unknown[], targetArray: unknown[], atLeastOne?: boolean): boolean;
  snakeToCapital(value: string): string;
  logger(...args: unknown[]): void;
  isLikelyJsonFile(file: File): boolean;
  getBaseUrl(): string;
  getPlaylistManageFormData(oneData?: string | null): FormDataEntryValue | [string, FormDataEntryValue][] | null;
  getCategories(): string[];
  getMediaItems(): MediaItem[];
  createCategory(): Promise<{ ok: boolean; message: string }>;
  renameCategory(categoryIndex: number, categoryName: string): Promise<{ ok: boolean; message: string }>;
  deleteCategory(categoryIndex: number): Promise<{ ok: boolean; message: string }>;
  downloadPlaylist(): { ok: boolean; message: string };
  importPlaylist(): Promise<{ ok: boolean; message: string }>;
}

function observeValidationMutations(
  form: HTMLFormElement,
  callback: (mutation: MutationRecord) => void
): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(callback);
  });
  observer.observe(form, { childList: true, attributes: true, subtree: true });
}

function setButtonDisabled(button: HTMLElement | null, disabled: boolean): void {
  if (!button) {
    return;
  }
  if (disabled) {
    button.setAttribute('disabled', '');
  } else {
    button.removeAttribute('disabled');
  }
}

function getCategoryEditElements(): {
  section: HTMLElement | null;
  select: HTMLSelectElement | null;
  fields: HTMLElement | null;
  nameInput: HTMLInputElement | null;
  mediaCountSummary: HTMLElement | null;
  mediaCount: HTMLElement | null;
  updateButton: HTMLButtonElement | null;
  deleteButton: HTMLButtonElement | null;
} {
  return {
    section: document.getElementById('playlist-management-field-category-edit'),
    select: document.getElementById('category-edit-target') as HTMLSelectElement | null,
    fields: document.getElementById('category-edit-fields'),
    nameInput: document.getElementById('category-edit-name') as HTMLInputElement | null,
    mediaCountSummary: document.getElementById('category-edit-media-count-summary'),
    mediaCount: document.getElementById('category-edit-media-count'),
    updateButton: document.getElementById('btn-update-category') as HTMLButtonElement | null,
    deleteButton: document.getElementById('btn-delete-category') as HTMLButtonElement | null,
  };
}

function getCategoryMediaCount(mediaItems: MediaItem[], categoryIndex: number): number {
  return mediaItems.filter((item) => item.catId === categoryIndex).length;
}

function getActiveTargetCategoryId(): number | null {
  const targetSelect = document.getElementById('target-category') as HTMLSelectElement | null;
  const value = targetSelect?.value ?? '';
  const categoryId = Number(value);
  return Number.isInteger(categoryId) && categoryId >= 0 ? categoryId : null;
}

export function bindPlaylistManagementForm(bindings: PlaylistManagementBindings): void {
  const {
    form,
    elements,
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
    setValidated,
    updateNotice,
    resetPlaylistManagementForm,
    fetchData,
    inArray,
    snakeToCapital,
    logger,
    isLikelyJsonFile,
    getBaseUrl,
    getPlaylistManageFormData,
    getCategories,
    getMediaItems,
    createCategory,
    renameCategory,
    deleteCategory,
    downloadPlaylist,
    importPlaylist,
  } = bindings;

  if (!form) {
    return;
  }

  let categoryEditInteracted = false;

  const clearCategoryEditName = (): void => {
    const edit = getCategoryEditElements();
    if (!edit.nameInput) {
      return;
    }
    edit.nameInput.value = '';
    setValidated(edit.nameInput, null);
  };

  const syncCategoryEditView = (options: {
    preferActiveCategory?: boolean;
    forceButtonsDisabled?: boolean;
  } = {}): void => {
    const edit = getCategoryEditElements();
    const categories = getCategories();
    const canMutate = canMutateCurrentPlaylist();
    const hasCategories = categories.length > 0;

    edit.section?.classList.toggle('hidden', !hasCategories);
    if (!edit.select) {
      return;
    }

    const activeCategoryId = getActiveTargetCategoryId();
    const selectedValue = options.preferActiveCategory && activeCategoryId !== null
      ? String(activeCategoryId)
      : edit.select.value;
    while (edit.select.firstChild) {
      edit.select.removeChild(edit.select.firstChild);
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = edit.select.dataset['placeholder'] || 'Choose a category';
    placeholder.selected = true;
    edit.select.appendChild(placeholder);

    categories.forEach((categoryName, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = categoryName;
      edit.select?.appendChild(option);
    });

    if (Array.from(edit.select.options).some((option) => option.value === selectedValue)) {
      edit.select.value = selectedValue;
    }

    edit.select.disabled = !canMutate;
    const selectedValueNow = edit.select.value;
    const selectedIndex = Number(selectedValueNow);
    const hasSelection = canMutate
      && selectedValueNow !== ''
      && Number.isInteger(selectedIndex)
      && selectedIndex >= 0
      && selectedIndex < categories.length;
    const mediaCount = hasSelection ? getCategoryMediaCount(getMediaItems(), selectedIndex) : 0;
    edit.fields?.classList.toggle('hidden', !hasCategories);
    if (edit.nameInput) {
      edit.nameInput.disabled = !hasSelection;
      if (!hasSelection) {
        edit.nameInput.value = '';
      }
    }
    if (edit.mediaCountSummary) {
      edit.mediaCountSummary.classList.toggle('hidden', !hasSelection);
    }
    if (edit.mediaCount) {
      edit.mediaCount.textContent = String(mediaCount);
    }

    const nextName = edit.nameInput?.value.trim() || '';
    const currentName = hasSelection ? (categories[selectedIndex] ?? '').trim() : '';
    const duplicate = hasSelection && categories.some((category, index) => (
      index !== selectedIndex && category.trim() === nextName
    ));
    const forceButtonsDisabled = options.forceButtonsDisabled === true || !categoryEditInteracted;
    setButtonDisabled(edit.updateButton, forceButtonsDisabled || !hasSelection || nextName === '' || nextName === currentName || duplicate);
    setButtonDisabled(edit.deleteButton, forceButtonsDisabled || !hasSelection || mediaCount > 0);
  };

  syncCategoryEditView({ preferActiveCategory: true, forceButtonsDisabled: true });

  document.getElementById('btn-options')?.addEventListener('click', () => {
    categoryEditInteracted = false;
    clearCategoryEditName();
    window.setTimeout(() => {
      clearCategoryEditName();
      syncCategoryEditView({ preferActiveCategory: true, forceButtonsDisabled: true });
    }, 0);
  });

  document.getElementById('btn-close-options')?.addEventListener('click', () => {
    categoryEditInteracted = false;
    clearCategoryEditName();
    syncCategoryEditView({ forceButtonsDisabled: true });
  });

  const optionsModal = document.getElementById('modal-options');
  if (optionsModal) {
    const observer = new MutationObserver((mutations) => {
      const closed = mutations.some((mutation) => (
        mutation.type === 'attributes'
          && mutation.attributeName === 'class'
          && optionsModal.classList.contains('hidden')
      ));
      if (!closed) {
        return;
      }
      categoryEditInteracted = false;
      clearCategoryEditName();
      syncCategoryEditView({ forceButtonsDisabled: true });
    });
    observer.observe(optionsModal, { attributes: true, attributeFilter: ['class'] });
  }

  elements.forEach((elm) => {
    const elmName = (elm as HTMLInputElement).name;

    switch (elmName) {
      case 'local_media_dir':
      case 'symlink_name':
      case 'category_name':
      case 'category_edit_name':
        elm.addEventListener('input', (evt: Event) => {
          if (elmName === 'category_edit_name') {
            categoryEditInteracted = true;
          }
          if ((evt.target as HTMLInputElement).value === '') {
            setValidated(elm, null);
          }
          syncCategoryEditView();
        });
        elm.addEventListener('change', (evt: Event) => {
          if (elmName === 'category_edit_name') {
            categoryEditInteracted = true;
          }
          setValidated(elm, (evt.target as HTMLInputElement).value !== '');
          syncCategoryEditView();
        });
        break;
      case 'category_edit_target':
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLSelectElement;
          const edit = getCategoryEditElements();
          const categories = getCategories();
          const selectedIndex = Number(target.value);
          const hasSelection = Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < categories.length;
          categoryEditInteracted = true;
          if (edit.nameInput) {
            edit.nameInput.value = hasSelection ? (categories[selectedIndex] ?? '') : '';
            setValidated(edit.nameInput, null);
          }
          syncCategoryEditView();
        });
        break;
      case 'import_playlist_file': {
        const importPicker = document.getElementById('btn-playlist-import-file-picker') as HTMLButtonElement | null;
        const importFileName = document.getElementById('playlist-import-file-name') as HTMLElement | null;
        const importDropzone = document.getElementById('playlist-import-dropzone') as HTMLElement | null;
        const importInput = elm as HTMLInputElement;

        const applyImportFile = (file: File | null): void => {
          const emptyLabel = importInput.dataset['labelEmpty'] || 'No file selected';
          if (importFileName) {
            importFileName.textContent = file ? file.name : emptyLabel;
          }
          if (!file) {
            setValidated(elm, null);
            setFileDropzoneState(importDropzone, { dragover: false, invalid: false });
            return;
          }
          const isValid = isLikelyJsonFile(file);
          setValidated(elm, isValid);
          setFileDropzoneState(importDropzone, { dragover: false, invalid: !isValid });
        };

        bindFileDropzone({
          input: importInput,
          picker: importPicker,
          fileName: importFileName,
          dropzone: importDropzone,
          dropLabelFallback: 'Drop JSON file here',
          onApplyFile: applyImportFile,
        });
        break;
      }
      case 'create_symlink':
      case 'create_category':
      case 'update_category':
      case 'delete_category':
      case 'download_playlist':
      case 'import_playlist': {
        const callback = {
          getFormData(oneData: string | null = null): FormDataEntryValue | [string, FormDataEntryValue][] | null {
            return getPlaylistManageFormData(oneData);
          },
          async createSymlink(): Promise<void> {
            const endpointURL = `${getBaseUrl()}symlink`;
            const payload: Record<string, string> = {};
            for (const pair of (this.getFormData() as [string, FormDataEntryValue][] | null) || []) {
              if (inArray(pair[0], ['local_media_dir', 'symlink_name'])) {
                payload[pair[0]] = String(pair[1]);
              }
            }
            const response = await fetchData(endpointURL, 'post', payload) as { state?: string; data?: string } | null;
            logger('createSymlink:', endpointURL, payload, response);
            updateNotice({
              type: response?.state === 'ok' ? 'success' : 'error',
              message: response?.data || '',
              delay: 2000,
            });
          },
          async createCategory(): Promise<void> {
            if (!canMutateCurrentPlaylist()) {
              const selfElm = document.getElementById('btn-create-category');
              applyCloudEditRestrictions();
              updateNotice({
                type: 'error',
                message: selfElm?.dataset['messageFailure'] || '',
                delay: 2400,
              });
              return;
            }
            const result = await createCategory();
            updateNotice({
              type: result.ok ? 'success' : 'error',
              message: result.message,
              delay: 2400,
            });
            syncCategoryEditView();
          },
          async updateCategory(): Promise<void> {
            if (!canMutateCurrentPlaylist()) {
              applyCloudEditRestrictions();
              updateNotice({
                type: 'error',
                message: (document.getElementById('btn-update-category') as HTMLElement | null)?.dataset['messageFailure'] || '',
                delay: 2400,
              });
              return;
            }
            const edit = getCategoryEditElements();
            const categoryIndex = Number(edit.select?.value ?? '');
            const categoryName = edit.nameInput?.value || '';
            const result = await renameCategory(categoryIndex, categoryName);
            updateNotice({
              type: result.ok ? 'success' : 'error',
              message: result.message,
              delay: 2400,
            });
            if (result.ok) {
              resetPlaylistManagementForm();
            }
            syncCategoryEditView();
          },
          async deleteCategory(): Promise<void> {
            if (!canMutateCurrentPlaylist()) {
              applyCloudEditRestrictions();
              updateNotice({
                type: 'error',
                message: (document.getElementById('btn-delete-category') as HTMLElement | null)?.dataset['messageFailure'] || '',
                delay: 2400,
              });
              return;
            }
            const edit = getCategoryEditElements();
            const categoryIndex = Number(edit.select?.value ?? '');
            const result = await deleteCategory(categoryIndex);
            updateNotice({
              type: result.ok ? 'success' : 'error',
              message: result.message,
              delay: 2400,
            });
            if (result.ok) {
              resetPlaylistManagementForm();
            }
            syncCategoryEditView();
          },
          async downloadPlaylist(): Promise<void> {
            const result = downloadPlaylist();
            updateNotice({
              type: result.ok ? 'success' : 'error',
              message: result.message,
              delay: 2000,
            });
          },
          async importPlaylist(): Promise<void> {
            const result = await importPlaylist();
            updateNotice({
              type: result.ok ? 'success' : 'error',
              message: result.message,
              delay: 2800,
            });
          },
        };

        elm.addEventListener('click', async (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          switch (snakeToCapital(target.name)) {
            case 'createSymlink':
              await callback.createSymlink();
              break;
            case 'createCategory':
              await callback.createCategory();
              break;
            case 'updateCategory':
              await callback.updateCategory();
              break;
            case 'deleteCategory':
              await callback.deleteCategory();
              break;
            case 'downloadPlaylist':
              await callback.downloadPlaylist();
              break;
            case 'importPlaylist':
              await callback.importPlaylist();
              break;
            default:
              break;
          }
          logger('onClickButton::', target.name);
          resetPlaylistManagementForm();
          syncCategoryEditView();
        });
        break;
      }
      default:
        logger('Event undefined element:', elmName, elm);
        break;
    }
  });

  observeValidationMutations(form, (mutation) => {
    if (mutation.type !== 'attributes' || mutation.attributeName !== 'data-validate') {
      return;
    }

    const validItems: string[] = [];
    if ((mutation.target as HTMLElement).getAttribute('data-validate') === 'true') {
      elements.forEach((elm) => {
        if (elm.getAttribute('data-validate') === 'true') validItems.push(elm.id);
      });
    }

    const buttonCreateSymlink = document.getElementById('btn-create-symlink');
    const symlinkContains = ['local-media-directory', 'symlink-name'];
    const isSymlinkContainAll = symlinkContains.every((id) => validItems.includes(id));
    logger('Check valid items for "Create Symlink":', validItems, symlinkContains, isSymlinkContainAll);
    setButtonDisabled(buttonCreateSymlink, !isSymlinkContainAll);

    const buttonCreateCategory = document.getElementById('btn-create-category');
    const categoryContains = ['category-name'];
    const isCategoryContainAll = categoryContains.every((id) => validItems.includes(id));
    logger('Check valid items for "Create Category":', validItems, categoryContains, isCategoryContainAll);
    if (!canMutateCurrentPlaylist()) {
      setButtonDisabled(buttonCreateCategory, false);
      applyCloudEditRestrictions();
    } else {
      setButtonDisabled(buttonCreateCategory, !isCategoryContainAll);
    }

    syncCategoryEditView();

    const buttonImportPlaylist = document.getElementById('btn-import-playlist');
    const importContains = ['playlist-import-file'];
    const isImportContainAll = importContains.every((id) => validItems.includes(id));
    logger('Check valid items for "Import Playlist":', validItems, importContains, isImportContainAll);
    setButtonDisabled(buttonImportPlaylist, !isImportContainAll);
  });
}
