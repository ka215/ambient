import type { MediaItem } from '../types/ambient';

export function applyMediaEditDirtyState(options: {
  isDirty: boolean;
  modalElement: HTMLElement | null;
  onDirtyChange: (isDirty: boolean) => void;
}): void {
  options.onDirtyChange(options.isDirty);
  options.modalElement?.setAttribute('data-dirty', String(options.isDirty));
}

export function hasActiveUnsavedMediaEditDraft<TDraft>(options: {
  activeItem: MediaItem | null;
  draftStore: Map<string, TDraft>;
  getDraftKey: (mediaItem: MediaItem) => string;
}): boolean {
  if (!options.activeItem) {
    return false;
  }

  return options.draftStore.has(options.getDraftKey(options.activeItem));
}
