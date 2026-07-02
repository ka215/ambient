import { bindFileDropzone, setFileDropzoneState } from './file-dropzone';

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
  createCategory(): { ok: boolean; message: string };
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
    createCategory,
    downloadPlaylist,
    importPlaylist,
  } = bindings;

  if (!form) {
    return;
  }

  elements.forEach((elm) => {
    const elmName = (elm as HTMLInputElement).name;

    switch (elmName) {
      case 'local_media_dir':
      case 'symlink_name':
      case 'category_name':
        elm.addEventListener('input', (evt: Event) => {
          if ((evt.target as HTMLInputElement).value === '') {
            setValidated(elm, null);
          }
        });
        elm.addEventListener('change', (evt: Event) => {
          setValidated(elm, (evt.target as HTMLInputElement).value !== '');
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
          createCategory(): void {
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
            const result = createCategory();
            updateNotice({
              type: result.ok ? 'success' : 'error',
              message: result.message,
              delay: 2400,
            });
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
              callback.createCategory();
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

    const buttonImportPlaylist = document.getElementById('btn-import-playlist');
    const importContains = ['playlist-import-file'];
    const isImportContainAll = importContains.every((id) => validItems.includes(id));
    logger('Check valid items for "Import Playlist":', validItems, importContains, isImportContainAll);
    setButtonDisabled(buttonImportPlaylist, !isImportContainAll);
  });
}
