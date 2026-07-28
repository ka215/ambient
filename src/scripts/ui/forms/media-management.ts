import { bindFileDropzone, setFileDropzoneState } from './file-dropzone';

export interface MediaManagementBindings {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  mediaCategorySelect: HTMLSelectElement | null;
  mediaTitleMaxLength: number;
  mediaArtistMaxLength: number;
  mediaDescMaxLength: number;
  getDefaultVolume(): number;
  normalizeVolume(value: unknown, fallback?: number): number;
  resetMediaManagementForm(): void;
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
  updateNotice(notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string; delay?: number }): void;
  addMediaData(payload: [string, string][], preferredCategoryId?: number | null): boolean;
  updatePlaylist(): void;
  clearCategory(): void;
  updateCategory(): void;
  getActiveCategoryId(): number | null;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  syncPlaybackAfterMediaAdd(): void;
  persistMediaEditForCurrentPlaylist(workingMedia: unknown[]): Promise<{ ok: boolean; message: string }>;
  hideOptionsModal(): void;
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  sanitizeMediaText(value: string, maxLength: number): string;
  sanitizeMediaTextInput(value: string, maxLength: number): string;
  sanitizeMediaDescInput(value: string, maxLength?: number): string;
  sanitizeMediaDescInputLive(value: string, maxLength?: number): string;
  basename(path: string): string;
  isLikelyMediaFile(file: File): boolean;
  getRelativeFilepath(basefile: string): Promise<boolean>;
  syncRangeProgress(range: HTMLInputElement | null): void;
  logger(...args: unknown[]): void;
  getMediaItems(): unknown[];
  getAddType(): string | null | undefined;
  setAddType(nextType: string): void;
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

function isValidMediaTime(value: string): boolean {
  return /^\d+$/.test(value) ||
    (value.indexOf(':') > 0 && /^(\d+:)?([0-5]?[0-9]:)?[0-5]?[0-9]$/.test(value));
}

export function bindMediaManagementForm(bindings: MediaManagementBindings): void {
  const {
    form,
    elements,
    mediaCategorySelect,
    mediaTitleMaxLength,
    mediaArtistMaxLength,
    mediaDescMaxLength,
    getDefaultVolume,
    normalizeVolume,
    resetMediaManagementForm,
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
    updateNotice,
    addMediaData,
    updatePlaylist,
    clearCategory,
    updateCategory,
    getActiveCategoryId,
    syncMediaCategoryField,
    syncPlaybackAfterMediaAdd,
    persistMediaEditForCurrentPlaylist,
    hideOptionsModal,
    setValidated,
    sanitizeMediaText,
    sanitizeMediaTextInput,
    sanitizeMediaDescInput,
    sanitizeMediaDescInputLive,
    basename,
    isLikelyMediaFile,
    getRelativeFilepath,
    syncRangeProgress,
    logger,
    getMediaItems,
    getAddType,
    setAddType,
  } = bindings;

  if (!form) {
    return;
  }

  elements.forEach((elm) => {
    const mediaUrlField = document.getElementById('media-management-field-media-url');
    const mediaFilesField = document.getElementById('media-management-field-media-files');
    const inputVideoId = document.getElementById('youtube-videoid') as HTMLInputElement | null;
    const inputFilepath = document.getElementById('local-media-filepath') as HTMLInputElement | null;
    const inputMediaTitle = document.getElementById('media-title') as HTMLInputElement | null;
    const localMediaPicker = document.getElementById('btn-local-media-file-picker') as HTMLButtonElement | null;
    const localMediaFileName = document.getElementById('local-media-file-name') as HTMLElement | null;
    const localMediaDropzone = document.getElementById('local-media-dropzone') as HTMLElement | null;
    const elmName = (elm as HTMLInputElement).name;

    switch (elmName) {
      case 'media_type':
        elm.addEventListener('click', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          const prevType = getAddType() ?? null;
          if (target.value === 'youtube') {
            mediaUrlField?.classList.remove('hidden');
            mediaFilesField?.classList.add('hidden');
          } else {
            mediaUrlField?.classList.add('hidden');
            mediaFilesField?.classList.remove('hidden');
          }
          setAddType(target.value);
          if (prevType !== target.value) {
            resetMediaManagementForm();
          }
        });
        break;
      case 'youtube_url':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          const value = target.value;
          const minLength = 'youtube.com/watch?v=.'.length;
          if (value.length < minLength) {
            setValidated(elm, null);
            if (inputVideoId) inputVideoId.value = '';
            return;
          }
          try {
            if (!/^(https?:\/\/|)([a-z0-9-]+\.)?youtube\.com/.test(value)) {
              throw new Error('Invalid URL.');
            }
            const normalizedValue = /^https?:\/\//.test(value) ? value : 'https://' + value;
            const url = new URL(normalizedValue);
            const videoid = url.searchParams.get('v');
            if (!url.hostname.endsWith('youtube.com') || videoid === null || videoid === '') {
              throw new Error('Invalid URL.');
            }
            if (/^https?:\/\//.test(value)) {
              target.value = url.hostname + url.pathname + '?v=' + videoid;
            }
            setValidated(elm, true);
            if (inputVideoId) inputVideoId.value = videoid;
          } catch (err) {
            logger('error', err, 'force');
            setValidated(elm, false);
          }
        });
        break;
      case 'local_media_file': {
        const localMediaInput = elm as HTMLInputElement;

        const clearLocalMediaFile = (): void => {
          if (localMediaFileName) {
            localMediaFileName.textContent = localMediaInput.dataset['labelEmpty'] || 'No file selected';
          }
          setFileDropzoneState(localMediaDropzone, { dragover: false, invalid: false });
          if (inputFilepath) inputFilepath.value = '';
          if (inputMediaTitle) inputMediaTitle.value = '';
          setValidated(elm, null);
          if (inputMediaTitle) setValidated(inputMediaTitle, null);
        };

        const applyLocalMediaFile = async (file: File | null): Promise<void> => {
          if (!file || file.size <= 0) {
            clearLocalMediaFile();
            return;
          }
          if (localMediaFileName) {
            localMediaFileName.textContent = file.name;
          }
          const mediaFileLooksValid = isLikelyMediaFile(file);
          const pathIsValid = mediaFileLooksValid ? await getRelativeFilepath(file.name) : false;
          setValidated(elm, mediaFileLooksValid && pathIsValid);
          setFileDropzoneState(localMediaDropzone, {
            dragover: false,
            invalid: !(mediaFileLooksValid && pathIsValid),
          });
          if (inputMediaTitle) {
            inputMediaTitle.value = mediaFileLooksValid && pathIsValid ? basename(file.name) : '';
            localMediaInput.blur();
            inputMediaTitle.dispatchEvent(new Event('change'));
          }
        };

        bindFileDropzone({
          input: localMediaInput,
          picker: localMediaPicker,
          fileName: localMediaFileName,
          dropzone: localMediaDropzone,
          dropLabelFallback: 'Drop media file here',
          onApplyFile: async (file: File | null): Promise<void> => {
            logger('local_file:', localMediaInput.files, [localMediaInput]);
            await applyLocalMediaFile(file);
          },
        });
        break;
      }
      case 'media_filepath':
        elm.addEventListener('change', (evt: Event) => {
          (evt.target as HTMLElement).focus();
        });
        break;
      case 'category':
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLSelectElement;
          setValidated(elm, target.value !== '');
        });
        break;
      case 'category_new_name':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaText(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() === '' ? null : true);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaText(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() !== '');
        });
        break;
      case 'title':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaTextInput(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() === '' ? null : true);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaText(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() !== '');
        });
        break;
      case 'artist':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaTextInput(target.value, mediaArtistMaxLength);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaText(target.value, mediaArtistMaxLength);
        });
        break;
      case 'desc':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaDescInputLive(target.value, mediaDescMaxLength);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaDescInput(target.value, mediaDescMaxLength);
        });
        break;
      case 'volume':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          const currentVolume = normalizeVolume(target.value, getDefaultVolume());
          target.value = String(currentVolume);
          syncRangeProgress(target);
          const volumeValue = document.getElementById('default-media-volume');
          if (volumeValue) volumeValue.textContent = String(currentVolume);
        });
        break;
      case 'start':
      case 'end':
        elm.addEventListener('input', (evt: Event) => {
          if ((evt.target as HTMLInputElement).value === '') {
            setValidated(elm, null);
          }
        });
        elm.addEventListener('change', (evt: Event) => {
          const value = (evt.target as HTMLInputElement).value;
          if (value === '') {
            setValidated(elm, null);
          } else {
            const isValid = isValidMediaTime(value);
            logger(value, isValid);
            setValidated(elm, isValid);
          }
        });
        break;
      case 'fadein':
      case 'fadeout':
        break;
      case 'add_media':
        elm.addEventListener('click', async () => {
          if (!canMutateCurrentPlaylist()) {
            applyCloudEditRestrictions();
            updateNotice({
              type: 'error',
              message: (elm as HTMLElement).dataset['messageFailure'] || '',
              delay: 2400,
            });
            return;
          }

          const formData = new FormData(form);
          const categoryField = mediaCategorySelect?.classList.contains('hidden')
            ? 'media-category-new'
            : 'media-category';
          const preferredCategoryValue = String(formData.get(categoryField) || '').trim();
          const numericPreferredCategory = Number(preferredCategoryValue);
          const resolvedPreferredCategory = !Number.isNaN(numericPreferredCategory)
            ? numericPreferredCategory
            : getActiveCategoryId();
          const result = addMediaData(
            Array.from(formData.entries()) as [string, string][],
            resolvedPreferredCategory
          );
          logger(result, getMediaItems());
          let persisted = true;

          updatePlaylist();
          resetMediaManagementForm();
          clearCategory();
          updateCategory();

          if (preferredCategoryValue !== '') {
            syncMediaCategoryField(Number.isNaN(numericPreferredCategory) ? null : numericPreferredCategory);
          }

          try {
            syncPlaybackAfterMediaAdd();
          } catch (error) {
            logger('error', error, 'force');
          }

          if (result) {
            const persistResult = await persistMediaEditForCurrentPlaylist(getMediaItems());
            persisted = persistResult.ok;
            if (persisted) {
              hideOptionsModal();
            }
          }

          updateNotice({
            type: result && persisted ? 'success' : 'error',
            message: result && persisted
              ? (elm as HTMLElement).dataset['messageSuccess'] || ''
              : (elm as HTMLElement).dataset['messageFailure'] || '',
            delay: 2400,
          });
        });
        break;
      default:
        logger('Event undefined element:', elmName, elm);
        break;
    }
  });

  observeValidationMutations(form, (mutation) => {
    if (mutation.type !== 'attributes' || mutation.attributeName !== 'data-validate') {
      return;
    }

    const formData = new FormData(form);
    const mediaType = formData.get('media_type') as string;
    const validItems: string[] = [];
    if ((mutation.target as HTMLElement).getAttribute('data-validate') === 'true') {
      elements.forEach((elm) => {
        if (elm.getAttribute('data-validate') === 'true') validItems.push(elm.id);
      });
    }

    const buttonAddMedia = document.getElementById('btn-add-media');
    if (!canMutateCurrentPlaylist()) {
      if (buttonAddMedia) {
        buttonAddMedia.removeAttribute('disabled');
      }
      applyCloudEditRestrictions();
      return;
    }

    const categoryField = mediaCategorySelect?.classList.contains('hidden')
      ? 'media-category-new'
      : 'media-category';
    const contains = [mediaType === 'youtube' ? 'youtube-url' : 'local-media-file', categoryField, 'media-title'];
    const isContainAll = contains.every((id) => validItems.includes(id));
    logger(`Check valid items for "${mediaType}":`, validItems, contains, isContainAll);
    if (buttonAddMedia) {
      if (isContainAll) {
        buttonAddMedia.removeAttribute('disabled');
      } else {
        buttonAddMedia.setAttribute('disabled', '');
      }
    }
  });
}
