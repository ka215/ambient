export interface MediaEditPrimaryControlBindings {
  closeButton: HTMLButtonElement | null;
  cancelButton: HTMLButtonElement | null;
  saveButton: HTMLButtonElement | null;
  form: HTMLFormElement | null;
  onClose(): void;
  onCancel(): void;
  onSave(): Promise<void> | void;
}

export interface MediaEditCategoryControlBindings {
  toggleButton: HTMLButtonElement | null;
  clearButton: HTMLButtonElement | null;
  categoryInput: HTMLInputElement | null;
  categoryCombobox: HTMLElement | null;
  isDropdownVisible(): boolean;
  openDropdown(): void;
  closeDropdown(restoreFocus?: boolean): void;
  syncClearButton(): void;
  renderOptions(): void;
}

export interface MediaEditFieldBindings {
  draftFields: Array<HTMLInputElement | HTMLTextAreaElement | null>;
  volumeInput: HTMLInputElement | null;
  timingFields: Array<HTMLInputElement | null>;
  timingStepperButtons: NodeListOf<Element>;
  onDraftFieldInput(): void;
  onDraftFieldChange(): void;
  onVolumeInput(): void;
  onVolumeBlur(): void;
  onTimingInput(field: HTMLInputElement): void;
  onTimingChange(field: HTMLInputElement): void;
  onTimingBlur(field: HTMLInputElement): void;
  onTimingStep(field: HTMLInputElement, direction: 1 | -1): void;
}

export interface MediaEditPreviewControlBindings {
  syncSeekStartButton: HTMLButtonElement | null;
  syncSeekEndButton: HTMLButtonElement | null;
  syncFadeinEndButton: HTMLButtonElement | null;
  syncFadeoutStartButton: HTMLButtonElement | null;
  previewRetryButton: HTMLButtonElement | null;
  onSyncSeekStart(): void;
  onSyncSeekEnd(): void;
  onSyncFadeinEnd(): void;
  onSyncFadeoutStart(): void;
  onPreviewRetry(): void;
}

export interface MediaEditThumbnailControlBindings {
  pickButton: HTMLButtonElement | null;
  input: HTMLInputElement | null;
  removeButton: HTMLButtonElement | null;
  clearButton: HTMLButtonElement | null;
  onPick(): void;
  onInputChange(): void;
  onRemove(): void;
}

export function bindMediaEditPrimaryControls(bindings: MediaEditPrimaryControlBindings): void {
  bindings.closeButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    bindings.onClose();
  });

  bindings.cancelButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    bindings.onCancel();
  });

  bindings.saveButton?.addEventListener('click', async (evt: Event) => {
    evt.preventDefault();
    await bindings.onSave();
  });

  bindings.form?.addEventListener('submit', (evt: Event) => {
    evt.preventDefault();
  });
}

export function bindMediaEditCategoryControls(bindings: MediaEditCategoryControlBindings): void {
  bindings.toggleButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    if (bindings.isDropdownVisible()) {
      bindings.closeDropdown(true);
    } else {
      bindings.openDropdown();
      bindings.categoryInput?.focus();
    }
  });

  if (bindings.clearButton && bindings.categoryInput) {
    bindings.clearButton.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      bindings.categoryInput!.value = '';
      bindings.syncClearButton();
      if (bindings.isDropdownVisible()) {
        bindings.renderOptions();
      }
      bindings.categoryInput!.dispatchEvent(new Event('input', { bubbles: true }));
      bindings.categoryInput!.dispatchEvent(new Event('change', { bubbles: true }));
      bindings.categoryInput!.focus();
    });
  }

  bindings.categoryInput?.addEventListener('keydown', (evt: KeyboardEvent) => {
    if (evt.key === 'ArrowDown') {
      evt.preventDefault();
      bindings.openDropdown();
    }
  });

  bindings.categoryInput?.addEventListener('input', () => {
    bindings.syncClearButton();
    if (bindings.isDropdownVisible()) {
      bindings.renderOptions();
    }
  });

  document.addEventListener('pointerdown', (evt: PointerEvent) => {
    if (!bindings.isDropdownVisible() || !(bindings.categoryCombobox instanceof HTMLElement)) {
      return;
    }
    const target = evt.target;
    if (target instanceof Node && !bindings.categoryCombobox.contains(target)) {
      bindings.closeDropdown(false);
    }
  });
}

export function bindMediaEditFieldControls(bindings: MediaEditFieldBindings): void {
  bindings.draftFields.forEach((field) => {
    if (!field) {
      return;
    }
    field.addEventListener('input', () => {
      bindings.onDraftFieldInput();
    });
    field.addEventListener('change', () => {
      bindings.onDraftFieldChange();
    });
  });

  bindings.volumeInput?.addEventListener('input', () => {
    bindings.onVolumeInput();
  });
  bindings.volumeInput?.addEventListener('blur', () => {
    bindings.onVolumeBlur();
  });

  bindings.timingFields.forEach((field) => {
    if (!field) {
      return;
    }
    field.addEventListener('input', () => {
      bindings.onTimingInput(field);
    });
    field.addEventListener('change', () => {
      bindings.onTimingChange(field);
    });
    field.addEventListener('blur', () => {
      bindings.onTimingBlur(field);
    });
  });

  bindings.timingStepperButtons.forEach((elm) => {
    if (!(elm instanceof HTMLButtonElement)) {
      return;
    }
    elm.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      const targetId = elm.dataset['target'] || '';
      if (targetId === '') {
        return;
      }
      const targetField = document.getElementById(targetId);
      if (!(targetField instanceof HTMLInputElement)) {
        return;
      }
      const direction: 1 | -1 = elm.dataset['stepDir'] === 'down' ? -1 : 1;
      bindings.onTimingStep(targetField, direction);
    });
  });
}

export function bindMediaEditPreviewControls(bindings: MediaEditPreviewControlBindings): void {
  bindings.syncSeekStartButton?.addEventListener('click', () => {
    bindings.onSyncSeekStart();
  });
  bindings.syncSeekEndButton?.addEventListener('click', () => {
    bindings.onSyncSeekEnd();
  });
  bindings.syncFadeinEndButton?.addEventListener('click', () => {
    bindings.onSyncFadeinEnd();
  });
  bindings.syncFadeoutStartButton?.addEventListener('click', () => {
    bindings.onSyncFadeoutStart();
  });
  bindings.previewRetryButton?.addEventListener('click', () => {
    bindings.onPreviewRetry();
  });
}

export function bindMediaEditThumbnailControls(bindings: MediaEditThumbnailControlBindings): void {
  if (bindings.pickButton && bindings.input) {
    bindings.pickButton.addEventListener('click', () => {
      bindings.onPick();
    });
  }

  bindings.input?.addEventListener('change', () => {
    bindings.onInputChange();
  });

  bindings.removeButton?.addEventListener('click', () => {
    bindings.onRemove();
  });
  bindings.clearButton?.addEventListener('click', () => {
    bindings.onRemove();
  });
}
