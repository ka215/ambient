import { setFileDropzoneState } from './file-dropzone';

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
