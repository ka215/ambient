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
