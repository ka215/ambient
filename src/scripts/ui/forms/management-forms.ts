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

export interface ResetMediaManagementFormOptions {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  addType: string | null | undefined;
  syncMediaVolumeField(): void;
}

export interface ResetPlaylistManagementFormOptions {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  logger(...args: unknown[]): void;
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

export function resetMediaManagementForm(options: ResetMediaManagementFormOptions): void {
  const { form, elements, addType, syncMediaVolumeField } = options;
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
  });

  if (localMediaFileName && localMediaFileInput) {
    localMediaFileName.textContent = localMediaFileInput.dataset['labelEmpty'] || 'No file selected';
  }
  setFileDropzoneState(localMediaDropzone, { dragover: false, invalid: false });
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
