import { setFileDropzoneState } from './file-dropzone';

export interface SyncMediaCategoryFieldOptions {
  select: HTMLSelectElement | null;
  categoryInput?: HTMLInputElement | null;
  categories: string[] | null | undefined;
  preferredCategoryId: number | null;
}

export interface SyncMediaVolumeFieldOptions {
  input: HTMLInputElement | null;
  display?: HTMLElement | null;
  volume: number;
  fallbackVolume: number;
}

export interface CategoryViewElements {
  targetSelect: HTMLSelectElement | null;
  mediaSelect: HTMLSelectElement | null;
  mediaInput?: HTMLInputElement | null;
  mediaLabel?: HTMLLabelElement | null;
  mediaNote?: HTMLElement | null;
}

export interface UpdateCategoryViewOptions {
  elements: CategoryViewElements;
  categories: string[] | null | undefined;
  syncTargetCategorySelection(): void;
  syncMediaCategoryField(): void;
  applyCloudEditRestrictions(): void;
}

export interface ResetMediaManagementFormOptions {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  addType: string | null | undefined;
  syncMediaVolumeField(): void;
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
}

export interface ResetPlaylistManagementFormOptions {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  logger(...args: unknown[]): void;
}

export function ensureSelectOption(
  select: HTMLSelectElement | null,
  value: string,
  label?: string
): void {
  if (!select) {
    return;
  }
  const alreadyExists = Array.from(select.options).some((opt) => opt.value === value);
  if (alreadyExists) {
    return;
  }

  const option = document.createElement('option');
  option.value = value;
  option.textContent = label ?? value;
  select.appendChild(option);
}

export function selectExistingOption(select: HTMLSelectElement | null, value: string): void {
  if (!select) {
    return;
  }
  const targetOption = Array.from(select.options).find((opt) => opt.value === value);
  if (targetOption) {
    select.value = value;
  }
}

function dispatchFieldEvent(field: HTMLElement, eventName: string | null): void {
  if (eventName) {
    field.dispatchEvent(new Event(eventName));
  }
}

function normalizeVolumeValue(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100
    ? numericValue
    : fallback;
}

export function syncMediaCategoryField(options: SyncMediaCategoryFieldOptions): void {
  const { select, categoryInput, categories, preferredCategoryId } = options;
  const hasVisibleSelect = select instanceof HTMLSelectElement && !select.classList.contains('hidden');

  if (hasVisibleSelect) {
    const hasPreferredOption = preferredCategoryId !== null &&
      Array.from(select.options).some((opt) => opt.value === String(preferredCategoryId));
    if (hasPreferredOption) {
      select.value = String(preferredCategoryId);
    } else if (categories && categories.length === 1) {
      select.value = '0';
    } else {
      select.value = '';
    }
    select.dispatchEvent(new Event('change'));
    return;
  }

  if (categoryInput && !categoryInput.classList.contains('hidden')) {
    const nextValue = categoryInput.value.trim() || categoryInput.dataset['defaultValue'] || 'New Category';
    categoryInput.value = nextValue;
    categoryInput.dispatchEvent(new Event('input'));
    categoryInput.dispatchEvent(new Event('change'));
  }
}

export function syncRangeProgress(range: HTMLInputElement | null, fallbackVolume: number): void {
  if (!range) {
    return;
  }
  const min = Number(range.min || 0);
  const max = Number(range.max || 100);
  const value = normalizeVolumeValue(range.value, fallbackVolume);
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
  range.style.setProperty('--range-progress', `${Math.min(100, Math.max(0, progress))}%`);
}

export function syncMediaVolumeField(options: SyncMediaVolumeFieldOptions): void {
  const { input, display, volume, fallbackVolume } = options;
  if (!input) {
    return;
  }
  const normalizedVolume = normalizeVolumeValue(volume, fallbackVolume);
  input.value = String(normalizedVolume);
  syncRangeProgress(input, fallbackVolume);
  if (display) {
    display.textContent = String(normalizedVolume);
  }
}

export function clearCategoryView(
  elements: CategoryViewElements,
  applyCloudEditRestrictions: () => void
): void {
  const { targetSelect, mediaSelect, mediaInput, mediaLabel, mediaNote } = elements;

  if (targetSelect) {
    const allCategory = document.getElementById('all-category');
    const clone = allCategory?.cloneNode(true) as HTMLElement | null;
    while (targetSelect.firstChild) {
      targetSelect.removeChild(targetSelect.firstChild);
    }
    if (clone) {
      targetSelect.appendChild(clone);
      targetSelect.firstElementChild?.setAttribute('disabled', '');
      targetSelect.setAttribute('disabled', '');
      targetSelect.value = '-1';
    }
  }

  if (mediaSelect) {
    while (mediaSelect.firstChild) {
      mediaSelect.removeChild(mediaSelect.firstChild);
    }
    const firstChild = document.createElement('option');
    firstChild.setAttribute('value', '');
    firstChild.textContent = mediaSelect.getAttribute('data-placeholder') || '';
    mediaSelect.appendChild(firstChild);
    mediaSelect.classList.remove('hidden');
    mediaSelect.disabled = false;
  }

  if (mediaInput) {
    mediaInput.classList.add('hidden');
    mediaInput.disabled = true;
  }
  mediaLabel?.setAttribute('for', 'media-category');
  mediaNote?.classList.add('hidden');
  applyCloudEditRestrictions();
}

export function updateCategoryView(options: UpdateCategoryViewOptions): void {
  const {
    elements,
    categories,
    syncTargetCategorySelection,
    syncMediaCategoryField,
    applyCloudEditRestrictions,
  } = options;
  const { targetSelect, mediaSelect, mediaInput, mediaLabel, mediaNote } = elements;
  const hasCategories = !!(categories && categories.length > 0);

  if (!hasCategories) {
    mediaSelect?.classList.add('hidden');
    if (mediaSelect) {
      mediaSelect.disabled = true;
    }
    if (mediaInput) {
      mediaInput.classList.remove('hidden');
      mediaInput.disabled = false;
      mediaInput.value = mediaInput.dataset['defaultValue'] || 'New Category';
    }
    mediaLabel?.setAttribute('for', 'media-category-new');
    mediaNote?.classList.add('hidden');
    targetSelect?.firstElementChild?.removeAttribute('disabled');
    targetSelect?.removeAttribute('disabled');
    syncTargetCategorySelection();
    applyCloudEditRestrictions();
    return;
  }

  mediaSelect?.classList.remove('hidden');
  if (mediaSelect) {
    mediaSelect.disabled = false;
  }
  if (mediaInput) {
    mediaInput.classList.add('hidden');
    mediaInput.disabled = true;
  }
  mediaLabel?.setAttribute('for', 'media-category');
  mediaNote?.classList.remove('hidden');

  categories.forEach((catName: string, catId: number) => {
    const optElm = document.createElement('option');
    optElm.value = String(catId);
    optElm.textContent = catName;
    if (categories.length === 1) {
      optElm.setAttribute('selected', 'selected');
    }
    targetSelect?.appendChild(optElm);
    mediaSelect?.appendChild(optElm.cloneNode(true));
  });
  targetSelect?.firstElementChild?.removeAttribute('disabled');
  targetSelect?.removeAttribute('disabled');
  syncTargetCategorySelection();
  syncMediaCategoryField();
  applyCloudEditRestrictions();
}

export function resetMediaManagementForm(options: ResetMediaManagementFormOptions): void {
  const { form, elements, addType, syncMediaVolumeField, setValidated } = options;
  if (!form) {
    return;
  }

  form.reset();
  const localMediaFileName = document.getElementById('local-media-file-name') as HTMLElement | null;
  const localMediaFileInput = document.getElementById('local-media-file') as HTMLInputElement | null;
  const localMediaDropzone = document.getElementById('local-media-dropzone') as HTMLElement | null;

  elements.forEach((child: HTMLElement) => {
    let eventName: string | null = null;
    if (/^input$/i.test(child.nodeName)) {
      const input = child as HTMLInputElement;
      switch (input.type) {
        case 'text':
          eventName = 'input';
          break;
        case 'radio':
          input.checked = input.value === (addType || 'youtube');
          break;
        case 'file':
          input.value = '';
          eventName = 'change';
          break;
        default:
          break;
      }
    } else if (/^textarea$/i.test(child.nodeName)) {
      eventName = 'input';
    } else if (/^select$/i.test(child.nodeName)) {
      (child as HTMLSelectElement).selectedIndex = 0;
      eventName = 'change';
    }
    dispatchFieldEvent(child, eventName);
    if (child.id && child.hasAttribute('data-validate')) {
      setValidated(child, null);
    }
  });

  if (localMediaFileName && localMediaFileInput) {
    localMediaFileName.textContent = localMediaFileInput.dataset['labelEmpty'] || 'No file selected';
  }
  setFileDropzoneState(localMediaDropzone, { dragover: false, invalid: false });
  const addMediaButton = document.getElementById('btn-add-media') as HTMLButtonElement | null;
  addMediaButton?.setAttribute('disabled', '');
  syncMediaVolumeField();
}

export function resetPlaylistManagementForm(options: ResetPlaylistManagementFormOptions): void {
  const { form, elements, setValidated, logger } = options;
  if (!form) {
    return;
  }

  form.reset();
  const importFileName = document.getElementById('playlist-import-file-name') as HTMLElement | null;

  elements.forEach((child: HTMLElement) => {
    let eventName: string | null = null;
    if (/^input$/i.test(child.nodeName)) {
      const input = child as HTMLInputElement;
      switch (input.type) {
        case 'text':
          eventName = 'input';
          break;
        case 'file':
          input.value = '';
          setValidated(input, null);
          if (importFileName) {
            const emptyLabel = input.dataset['labelEmpty'] || 'No file selected';
            importFileName.textContent = emptyLabel;
          }
          break;
        case 'checkbox':
          input.checked = false;
          break;
        default:
          break;
      }
    }
    if (eventName) {
      logger('resetPlaylistManageForm:', child, eventName);
      child.dispatchEvent(new Event(eventName));
    }
  });
}
