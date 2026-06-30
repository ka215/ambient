export interface FileDropzoneBinding {
  input: HTMLInputElement;
  picker?: HTMLButtonElement | null;
  fileName?: HTMLElement | null;
  dropzone?: HTMLElement | null;
  dropLabelFallback: string;
  onApplyFile(file: File | null): void | Promise<void>;
}

export interface FileDropzoneState {
  dragover: boolean;
  invalid: boolean;
}

export function setFileDropzoneState(
  dropzone: HTMLElement | null | undefined,
  state: Partial<FileDropzoneState>
): void {
  if (!dropzone) {
    return;
  }
  if (typeof state.dragover === 'boolean') {
    dropzone.classList.toggle('is-dragover', state.dragover);
  }
  if (typeof state.invalid === 'boolean') {
    dropzone.classList.toggle('is-invalid', state.invalid);
  }
}

function setInputFile(input: HTMLInputElement, file: File): void {
  try {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
  } catch (_error) {
    // Some environments may not allow constructing DataTransfer.
  }
}

function getCurrentFile(input: HTMLInputElement): File | null {
  return input.files && input.files.length > 0 ? input.files[0] ?? null : null;
}

function isDragLeavingDropzone(dropzone: HTMLElement | null | undefined, evt: DragEvent): boolean {
  if (!dropzone) {
    return true;
  }
  const related = evt.relatedTarget as Node | null;
  return !(related && dropzone.contains(related));
}

export function bindFileDropzone(binding: FileDropzoneBinding): void {
  const { input, picker, fileName, dropzone, dropLabelFallback, onApplyFile } = binding;

  if (picker) {
    picker.addEventListener('click', () => {
      input.click();
    });
  }

  if (dropzone) {
    const onDragOver = (evt: DragEvent): void => {
      evt.preventDefault();
      evt.stopPropagation();
      const dropLabel = input.dataset['labelDrop'] || dropLabelFallback;
      if (fileName && (!input.files || input.files.length === 0)) {
        fileName.textContent = dropLabel;
      }
      setFileDropzoneState(dropzone, { dragover: true, invalid: false });
    };

    dropzone.addEventListener('dragenter', onDragOver);
    dropzone.addEventListener('dragover', onDragOver);
    dropzone.addEventListener('dragleave', (evt: DragEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (isDragLeavingDropzone(dropzone, evt)) {
        void onApplyFile(getCurrentFile(input));
      }
    });
    dropzone.addEventListener('drop', (evt: DragEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      const file = evt.dataTransfer?.files && evt.dataTransfer.files.length > 0
        ? evt.dataTransfer.files[0] ?? null
        : null;
      if (file) {
        setInputFile(input, file);
      }
      void onApplyFile(file);
    });
  }

  input.addEventListener('change', (evt: Event) => {
    const target = evt.target as HTMLInputElement;
    void onApplyFile(getCurrentFile(target));
  });
}
