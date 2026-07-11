import type { MediaItem } from '../../types/ambient';

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

export function bindMediaEditDraftState<TDraft>(options: {
  mediaItem: MediaItem;
  draftStore: Map<string, TDraft>;
  getDraftKey: (mediaItem: MediaItem) => string;
  createBaseDraft: (mediaItem: MediaItem) => TDraft;
  isSameDraft: (a: TDraft, b: TDraft) => boolean;
}): {
  activeItem: MediaItem;
  baseDraft: TDraft;
  initialDraft: TDraft;
  isDirty: boolean;
} {
  const baseDraft = options.createBaseDraft(options.mediaItem);
  const draftKey = options.getDraftKey(options.mediaItem);
  const sessionDraft = options.draftStore.get(draftKey) || null;
  const initialDraft = sessionDraft || baseDraft;

  return {
    activeItem: options.mediaItem,
    baseDraft,
    initialDraft,
    isDirty: !options.isSameDraft(initialDraft, baseDraft),
  };
}

export function discardMediaEditDraft(options: {
  activeItem: MediaItem | null;
  getDraftKey: (mediaItem: MediaItem) => string;
  deleteDraftByKey: (key: string) => void;
  setDirtyState: (isDirty: boolean) => void;
}): void {
  if (options.activeItem) {
    options.deleteDraftByKey(options.getDraftKey(options.activeItem));
  }
  options.setDirtyState(false);
}

export function clearMediaEditStateContext(options: {
  setActiveItem: (mediaItem: MediaItem | null) => void;
  setBaseDraft: (draft: unknown | null) => void;
  setPreviewSourceItem: (mediaItem: MediaItem | null) => void;
  setDirtyState: (isDirty: boolean) => void;
}): void {
  options.setActiveItem(null);
  options.setBaseDraft(null);
  options.setPreviewSourceItem(null);
  options.setDirtyState(false);
}

export function canOpenMediaEditModal(options: {
  mediaItem: MediaItem;
  activeItem: MediaItem | null;
  getDraftKey: (mediaItem: MediaItem) => string;
  confirmDiscard: (fallbackMessage: string) => boolean;
  getLocalizedMessage: (key: string, fallback: string) => string;
}): boolean {
  const nextDraftKey = options.getDraftKey(options.mediaItem);
  const activeDraftKey = options.activeItem ? options.getDraftKey(options.activeItem) : null;

  if (activeDraftKey === null || activeDraftKey === nextDraftKey) {
    return true;
  }

  return options.confirmDiscard(
    options.getLocalizedMessage(
      'mediaEditDiscardAndOpenAnother',
      'Discard unsaved edits and open another item?'
    )
  );
}

export function confirmDiscardMediaEditDraft(options: {
  hasUnsavedDraft: boolean;
  isDirty: boolean;
  fallbackMessage: string;
  getLocalizedMessage: (key: string, fallback: string) => string;
  confirm: (message: string) => boolean;
  discardDraft: () => void;
}): boolean {
  if (!options.hasUnsavedDraft && !options.isDirty) {
    return true;
  }

  const message = options.getLocalizedMessage(
    'Discard unsaved media edits?',
    options.fallbackMessage
  );
  const shouldDiscard = options.confirm(message);
  if (!shouldDiscard) {
    return false;
  }

  options.discardDraft();
  return true;
}

export function applyBoundMediaEditDraftState<TDraft>(options: {
  binding: {
    activeItem: MediaItem;
    baseDraft: TDraft;
    initialDraft: TDraft;
    isDirty: boolean;
  };
  setActiveItem: (mediaItem: MediaItem) => void;
  setBaseDraft: (draft: TDraft) => void;
  applyDraftToForm: (draft: TDraft) => void;
  setDirtyState: (isDirty: boolean) => void;
  validateDraft: () => void;
}): void {
  options.setActiveItem(options.binding.activeItem);
  options.setBaseDraft(options.binding.baseDraft);
  options.applyDraftToForm(options.binding.initialDraft);
  options.setDirtyState(options.binding.isDirty);
  options.validateDraft();
}
