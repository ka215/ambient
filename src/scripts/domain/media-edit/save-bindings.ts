import type { MediaItem } from '../../types/ambient';
import {
  deleteMediaEditThumbnailIfNeeded,
  executeMediaEditSavePipeline,
  prepareMediaEditSaveExecution,
  resolveMediaEditValidationGate,
  persistMediaEditForCurrentPlaylist,
  uploadMediaEditThumbnailIfNeeded,
} from './save';
import type { MediaEditDraft } from './draft';

export function createMediaEditSaveBindings(options: {
  status: {
    media: MediaItem[] | null;
    category: string[] | null;
    playlist: string | null;
    current: number | null;
  };
  getActiveItem: () => MediaItem | null;
  getBaseDraft: () => MediaEditDraft | null;
  getLocalizedMessage: (key: string, fallback?: string) => string;
  ensureCategory: (categories: string[] | null, categoryName: string) => string[] | null;
  readDraftFromForm: () => MediaEditDraft;
  validateDraft: () => { valid: boolean };
  setSaveButtonDisabled: (disabled: boolean) => void;
  setSaveBusyState: (isBusy: boolean) => void;
  updateNotice: (notification: NotificationPayload) => void;
  applyDraftToMediaItem: (item: MediaItem, draft: MediaEditDraft) => MediaItem;
  uploadThumbnail: (draft: MediaEditDraft) => Promise<{ ok: boolean; message: string }>;
  deleteThumbnail: (draft: MediaEditDraft) => Promise<{ ok: boolean; message: string }>;
  persistWorkingMedia: (workingMedia: MediaItem[]) => Promise<{ ok: boolean; message: string }>;
  finalizeSave: (options: {
    activeItem: MediaItem;
    updatedItem: MediaItem;
    persistMessage: string;
  }) => void;
  failSave: (message: string, delay?: number) => void;
}): {
  saveMediaEdit: () => Promise<void>;
} {
  async function saveMediaEdit(): Promise<void> {
    const activeItem = options.getActiveItem();
    const baseDraft = options.getBaseDraft();
    if (!activeItem || !baseDraft || !Array.isArray(options.status.media)) {
      return;
    }

    const validationGate = resolveMediaEditValidationGate({
      valid: options.validateDraft().valid,
      invalidMessage: options.getLocalizedMessage('Please fix the validation errors before saving.'),
    });
    if (!validationGate.ok) {
      options.setSaveButtonDisabled(true);
      options.updateNotice({
        type: 'error',
        message: validationGate.message,
        delay: validationGate.delay,
      });
      return;
    }

    const draft = options.readDraftFromForm();
    options.status.category = options.ensureCategory(options.status.category, draft.category);
    options.setSaveBusyState(true);

    const saveTarget = prepareMediaEditSaveExecution({
      mediaItems: options.status.media,
      activeMediaId: activeItem.amId,
      updatedItemFactory: (item) => options.applyDraftToMediaItem(item, draft),
    });
    if (!saveTarget) {
      options.setSaveBusyState(false);
      return;
    }

    const { workingMedia, updatedItem } = saveTarget;
    const previousMedia = options.status.media;
    options.status.media = workingMedia;

    const persistResult = await executeMediaEditSavePipeline({
      workingMedia,
      updatedItem,
      uploadThumbnail: () => options.uploadThumbnail(draft),
      deleteThumbnail: () => options.deleteThumbnail(draft),
      persistWorkingMedia: (nextWorkingMedia) => options.persistWorkingMedia(nextWorkingMedia),
    });
    if (!persistResult.ok) {
      options.status.media = previousMedia;
      options.failSave(persistResult.message);
      return;
    }

    options.finalizeSave({
      activeItem,
      updatedItem: persistResult.updatedItem,
      persistMessage: persistResult.persistMessage,
    });
  }

  return { saveMediaEdit };
}

export {
  deleteMediaEditThumbnailIfNeeded,
  persistMediaEditForCurrentPlaylist,
  uploadMediaEditThumbnailIfNeeded,
};
