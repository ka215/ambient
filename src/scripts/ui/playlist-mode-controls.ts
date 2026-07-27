import type { PlaylistMode } from './playlist-view';

export interface PlaylistModeControlBindings {
  button: HTMLButtonElement | null;
  menu: HTMLElement | null;
  onModeButtonClick(): void;
  onModeSelect(mode: PlaylistMode): void;
  closeMenu(): void;
}

export interface PlaylistConfirmModalBindings {
  modal: HTMLElement | null;
  applyButton: HTMLButtonElement | null;
  cancelButton: HTMLButtonElement | null;
  onApply(): void;
  onCancel(): void;
}

function isPlaylistMode(value: string | undefined): value is PlaylistMode {
  return value === 'normal' || value === 'edit' || value === 'reorder' || value === 'delete';
}

export function bindPlaylistModeControls(bindings: PlaylistModeControlBindings): void {
  const { button, menu, onModeButtonClick, onModeSelect, closeMenu } = bindings;
  if (!button || !menu) {
    return;
  }

  button.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    evt.stopPropagation();
    onModeButtonClick();
  });

  Array.from(menu.querySelectorAll('.playlist-mode-option')).forEach((elm) => {
    elm.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      evt.stopPropagation();
      const optionElm = evt.currentTarget as HTMLButtonElement;
      if (optionElm.disabled || optionElm.getAttribute('aria-disabled') === 'true') {
        return;
      }
      const nextMode = optionElm.dataset['mode'];
      if (isPlaylistMode(nextMode)) {
        onModeSelect(nextMode);
      }
    });
  });

  document.addEventListener('click', (evt: MouseEvent) => {
    const target = evt.target as Node;
    if (!menu.contains(target) && !button.contains(target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (evt: KeyboardEvent) => {
    if (evt.key === 'Escape') {
      closeMenu();
    }
  });
}

export function bindPlaylistConfirmModalControls(bindings: PlaylistConfirmModalBindings): void {
  bindings.applyButton?.addEventListener('click', () => {
    bindings.onApply();
  });

  bindings.cancelButton?.addEventListener('click', () => {
    bindings.onCancel();
  });

  bindings.modal?.addEventListener('click', (evt: MouseEvent) => {
    const target = evt.target;
    const isBackdrop = target instanceof HTMLElement &&
      target.parentElement === bindings.modal &&
      target.getAttribute('aria-hidden') === 'true';
    if (target === bindings.modal || isBackdrop) {
      bindings.onCancel();
    }
  });
}
