import type { MediaItem } from '../../types/ambient';
import type { MediaEditDraft, MediaEditDraftInput } from './draft';
import {
  applyBoundMediaEditDraftState,
  bindMediaEditDraftState,
  clearMediaEditStateContext,
  discardMediaEditDraft,
  hasActiveUnsavedMediaEditDraft,
} from './session-state';
import { deleteMediaEditDraftEntry, hydrateMediaEditDraftMap } from '../../state/media-edit-draft-store';
import { syncSessionDraftState } from '../../state/session-draft-store';
import { createMediaEditBaseDraft, createMediaEditDraftKey, readMediaEditDraftFromForm } from './draft';

export function createMediaEditDraftBindings(options: {
  storageKey: string;
  status: { playlist: string | null };
  draftStore: Map<string, MediaEditDraft>;
  getActiveItem: () => MediaItem | null;
  setActiveItem: (mediaItem: MediaItem | null) => void;
  getBaseDraft: () => MediaEditDraft | null;
  setBaseDraft: (draft: MediaEditDraft | null) => void;
  setPreviewSourceItem: (mediaItem: MediaItem | null) => void;
  setDirtyState: (isDirty: boolean) => void;
  isSameDraft: (a: MediaEditDraft, b: MediaEditDraft) => boolean;
  cloneDraft: (draft: MediaEditDraft) => MediaEditDraft;
  sanitizeDraft: (draft: MediaEditDraftInput, fallback?: MediaEditDraft | null) => MediaEditDraft;
  createEmptyDraft: () => MediaEditDraft;
  getItemIdentity: (mediaItem: MediaItem) => string;
  getMediaCategoryName: (mediaItem: MediaItem) => string;
  sanitizeDescription: (value: string) => string;
  getTiming: (mediaItem: MediaItem) => {
    seekStart: number | null;
    seekEnd: number | null;
    fadeInEnd: number | null;
    fadeOutStart: number | null;
  };
  getDefaultVolume: () => number;
  applyDraftToForm: (draft: MediaEditDraft) => void;
  validateDraft: () => void;
  readFormValues: () => {
    category: string | undefined;
    title: string | undefined;
    artist: string | undefined;
    description: string | undefined;
    volume: number | undefined;
    seekStart: string | undefined;
    seekEnd: string | undefined;
    fadeInEnd: string | undefined;
    fadeOutStart: string | undefined;
    youtubeCcOverride: boolean | undefined;
    youtubeCc: boolean | undefined;
    youtubeFsOverride: boolean | undefined;
    youtubeFs: boolean | undefined;
    youtubeControlsOverride: boolean | undefined;
    youtubeControls: boolean | undefined;
    youtubeDisablekbOverride: boolean | undefined;
    youtubeDisablekb: boolean | undefined;
  };
}): {
  getMediaEditDraftKey: (mediaItem: MediaItem) => string;
  hydrateMediaEditDraftStore: () => void;
  deleteMediaEditDraftByKey: (key: string) => void;
  createMediaEditBaseDraft: (mediaItem: MediaItem) => MediaEditDraft;
  readMediaEditDraftFromForm: () => MediaEditDraft;
  isActiveMediaEditUnsaved: () => boolean;
  syncMediaEditDraftStateFromForm: () => void;
  applyMediaEditDraftState: (nextDraft: MediaEditDraft) => void;
  discardActiveMediaEditDraft: () => void;
  clearMediaEditContext: () => void;
  bindMediaEditForm: (mediaItem: MediaItem) => void;
} {
  function getMediaEditDraftKey(mediaItem: MediaItem): string {
    const playlistKey = (options.status.playlist || '').trim() || '__playlist__';
    return createMediaEditDraftKey(playlistKey, options.getItemIdentity(mediaItem));
  }

  function hydrateMediaEditDraftStore(): void {
    hydrateMediaEditDraftMap({
      storageKey: options.storageKey,
      targetStore: options.draftStore,
      parseEntry: (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return null;
        }
        const source = value as Record<string, unknown>;
        return options.sanitizeDraft({
          category: source['category'],
          title: source['title'],
          artist: source['artist'],
          description: source['description'],
          volume: source['volume'],
          seekStart: source['seekStart'],
          seekEnd: source['seekEnd'],
          fadeInEnd: source['fadeInEnd'],
          fadeOutStart: source['fadeOutStart'],
          youtubeCcOverride: source['youtubeCcOverride'],
          youtubeCc: source['youtubeCc'],
          youtubeFsOverride: source['youtubeFsOverride'],
          youtubeFs: source['youtubeFs'],
          youtubeControlsOverride: source['youtubeControlsOverride'],
          youtubeControls: source['youtubeControls'],
          youtubeDisablekbOverride: source['youtubeDisablekbOverride'],
          youtubeDisablekb: source['youtubeDisablekb'],
        });
      },
    });
  }

  function deleteMediaEditDraftByKey(key: string): void {
    deleteMediaEditDraftEntry({
      storageKey: options.storageKey,
      draftStore: options.draftStore,
      key,
    });
  }

  function createBaseDraft(mediaItem: MediaItem): MediaEditDraft {
    return createMediaEditBaseDraft({
      mediaItem,
      categoryName: options.getMediaCategoryName(mediaItem),
      description: options.sanitizeDescription(String(mediaItem.desc || '')),
      timing: options.getTiming(mediaItem),
      defaultVolume: options.getDefaultVolume(),
      sanitizeDraft: options.sanitizeDraft,
    });
  }

  function readDraftFromForm(): MediaEditDraft {
    const fallback = options.getBaseDraft() || options.createEmptyDraft();
    const activeItem = options.getActiveItem();
    const activeDraft = activeItem
      ? options.draftStore.get(getMediaEditDraftKey(activeItem)) || null
      : null;
    const values = options.readFormValues();
    return readMediaEditDraftFromForm({
      fallback,
      activeDraft,
      ...values,
      sanitizeDraft: options.sanitizeDraft,
    });
  }

  function isActiveUnsaved(): boolean {
    return hasActiveUnsavedMediaEditDraft({
      activeItem: options.getActiveItem(),
      draftStore: options.draftStore,
      getDraftKey: getMediaEditDraftKey,
    });
  }

  function syncDraftState(nextDraft: MediaEditDraft): void {
    const activeItem = options.getActiveItem();
    const baseDraft = options.getBaseDraft();
    if (!activeItem || !baseDraft) {
      return;
    }
    const currentKey = getMediaEditDraftKey(activeItem);
    const isDirty = syncSessionDraftState({
      storageKey: options.storageKey,
      draftStore: options.draftStore,
      key: currentKey,
      baseDraft,
      nextDraft,
      isSameDraft: options.isSameDraft,
      cloneDraft: options.cloneDraft,
    });
    options.setDirtyState(isDirty);
  }

  function syncMediaEditDraftStateFromForm(): void {
    syncDraftState(readDraftFromForm());
  }

  function discardActiveMediaEditDraft(): void {
    discardMediaEditDraft({
      activeItem: options.getActiveItem(),
      getDraftKey: getMediaEditDraftKey,
      deleteDraftByKey: deleteMediaEditDraftByKey,
      setDirtyState: options.setDirtyState,
    });
  }

  function clearContext(): void {
    clearMediaEditStateContext({
      setActiveItem: options.setActiveItem,
      setBaseDraft: (draft) => options.setBaseDraft(draft as MediaEditDraft | null),
      setPreviewSourceItem: options.setPreviewSourceItem,
      setDirtyState: options.setDirtyState,
    });
  }

  function bindMediaEditForm(mediaItem: MediaItem): void {
    const binding = bindMediaEditDraftState({
      mediaItem,
      draftStore: options.draftStore,
      getDraftKey: getMediaEditDraftKey,
      createBaseDraft,
      isSameDraft: options.isSameDraft,
    });
    applyBoundMediaEditDraftState({
      binding,
      setActiveItem: (nextItem) => options.setActiveItem(nextItem),
      setBaseDraft: (draft) => options.setBaseDraft(draft as MediaEditDraft),
      applyDraftToForm: options.applyDraftToForm,
      setDirtyState: options.setDirtyState,
      validateDraft: options.validateDraft,
    });
  }

  return {
    getMediaEditDraftKey,
    hydrateMediaEditDraftStore,
    deleteMediaEditDraftByKey,
    createMediaEditBaseDraft: createBaseDraft,
    readMediaEditDraftFromForm: readDraftFromForm,
    isActiveMediaEditUnsaved: isActiveUnsaved,
    syncMediaEditDraftStateFromForm,
    applyMediaEditDraftState: syncDraftState,
    discardActiveMediaEditDraft,
    clearMediaEditContext: clearContext,
    bindMediaEditForm,
  };
}
