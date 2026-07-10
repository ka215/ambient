import { parseJsonWithBom as sharedParseJsonWithBom } from '../shared/string';
import {
  deleteMediaEditThumbnail as deleteMediaEditThumbnailPlatform,
  persistPlaylistMediaEdit,
  uploadMediaEditThumbnail as uploadMediaEditThumbnailPlatform,
} from '../platform/media-edit-persistence';
import {
  deleteMediaEditThumbnailIfNeeded as deleteMediaEditThumbnailIfNeededState,
  persistMediaEditForCurrentPlaylist as persistMediaEditForCurrentPlaylistState,
  uploadMediaEditThumbnailIfNeeded as uploadMediaEditThumbnailIfNeededState,
} from '../state/media-edit-save';
import { createMediaEditSaveBindings } from '../state/media-edit-save-bindings';
import type { MediaEditDraft } from '../state/media-edit-draft';
import type { MediaItem } from '../types/ambient';

export interface InitializeMediaEditSaveRuntimeOptions {
  baseUrl: string;
  saveEndpoint: string;
  thumbnailEndpoint: string;
  status: {
    media: MediaItem[] | null;
    category: string[] | null;
    playlist: string | null;
    current: number | null;
  };
  saveButton: HTMLButtonElement | null;
  getActiveItem(): MediaItem | null;
  getBaseDraft(): MediaEditDraft | null;
  setBaseDraft(draft: MediaEditDraft): void;
  getDraftKey(mediaItem: MediaItem): string;
  deleteDraftByKey(key: string): void;
  createBaseDraft(mediaItem: MediaItem): MediaEditDraft;
  setDirtyState(isDirty: boolean): void;
  clearCategory(): void;
  updateCategory(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  getActiveCategoryId(): number | null;
  updatePlaylist(): void;
  updatePlayStatus(amId: number): void;
  hideMediaEditModal(restoreFocus?: boolean): void;
  getLocalizedMessage(key: string, fallback?: string): string;
  updateNotice(notification: NotificationPayload): void;
  isLocalMode(): boolean;
  isCloudMode(): boolean;
  persistCloudPlaylist(): boolean;
  generatePlaylistJson(pretty?: boolean): string;
  ensureCategory(categories: string[] | null, categoryName: string): string[] | null;
  readDraftFromForm(): MediaEditDraft;
  validateDraft(): { valid: boolean };
  setSaveButtonDisabled(disabled: boolean): void;
  applyDraftToMediaItem(item: MediaItem, draft: MediaEditDraft): MediaItem;
}

export function initializeMediaEditSaveRuntime(options: InitializeMediaEditSaveRuntimeOptions): {
  saveMediaEdit: () => Promise<void>;
  persistMediaEditForCurrentPlaylist: (workingMedia: MediaItem[]) => Promise<{ ok: boolean; message: string }>;
} {
  async function uploadMediaEditThumbnailIfNeeded(draft: MediaEditDraft): Promise<{ ok: boolean; message: string }> {
    return uploadMediaEditThumbnailIfNeededState({
      draft,
      isLocalMode: options.isLocalMode(),
      getLocalizedMessage: options.getLocalizedMessage,
      upload: async (nextDraft) => uploadMediaEditThumbnailPlatform({
        baseUrl: options.baseUrl,
        endpoint: options.thumbnailEndpoint,
        filename: nextDraft.thumbnailName,
        dataUrl: nextDraft.thumbnailDataUrl,
        getLocalizedMessage: options.getLocalizedMessage,
      }),
    });
  }

  async function deleteMediaEditThumbnailIfNeeded(draft: MediaEditDraft): Promise<{ ok: boolean; message: string }> {
    return deleteMediaEditThumbnailIfNeededState({
      draft,
      baseThumbnailName: options.getBaseDraft()?.thumbnailName || '',
      isLocalMode: options.isLocalMode(),
      getLocalizedMessage: options.getLocalizedMessage,
      remove: async (filename) => deleteMediaEditThumbnailPlatform({
        baseUrl: options.baseUrl,
        endpoint: options.thumbnailEndpoint,
        filename,
        getLocalizedMessage: options.getLocalizedMessage,
      }),
    });
  }

  async function persistMediaEditForCurrentPlaylist(workingMedia: MediaItem[]): Promise<{ ok: boolean; message: string }> {
    return persistMediaEditForCurrentPlaylistState({
      workingMedia,
      isCloud: options.isCloudMode(),
      playlistName: options.status.playlist || '',
      persistCloud: options.persistCloudPlaylist,
      persistRemote: async () => {
        const payloadText = options.generatePlaylistJson(false);
        const payloadObject = sharedParseJsonWithBom(payloadText);
        return persistPlaylistMediaEdit({
          baseUrl: options.baseUrl,
          endpoint: options.saveEndpoint,
          playlistName: options.status.playlist || '',
          payloadObject,
          getLocalizedMessage: options.getLocalizedMessage,
        });
      },
      getLocalizedMessage: options.getLocalizedMessage,
    });
  }

  function setMediaEditSaveBusyState(isBusy: boolean): void {
    if (!options.saveButton) {
      return;
    }
    options.saveButton.disabled = isBusy;
    if (isBusy) {
      options.saveButton.setAttribute('aria-busy', 'true');
      return;
    }
    options.saveButton.removeAttribute('aria-busy');
  }

  function failMediaEditSave(message: string, delay: number = 2600): void {
    setMediaEditSaveBusyState(false);
    options.updateNotice({ type: 'error', message, delay });
  }

  function finalizeMediaEditSave(finalizeOptions: {
    activeItem: MediaItem;
    updatedItem: MediaItem;
    persistMessage: string;
  }): void {
    const draftKey = options.getDraftKey(finalizeOptions.activeItem);
    options.deleteDraftByKey(draftKey);
    options.setBaseDraft(options.createBaseDraft(finalizeOptions.updatedItem));
    options.setDirtyState(false);
    options.clearCategory();
    options.updateCategory();
    options.syncMediaCategoryField(options.getActiveCategoryId());
    options.updatePlaylist();
    if (options.status.current === finalizeOptions.updatedItem.amId) {
      options.updatePlayStatus(finalizeOptions.updatedItem.amId);
    }
    setMediaEditSaveBusyState(false);
    options.updateNotice({
      type: 'success',
      message: finalizeOptions.persistMessage || options.getLocalizedMessage(
        'mediaEditSaveSuccess',
        'Media changes were saved successfully.'
      ),
      delay: 2200,
    });
    options.hideMediaEditModal(true);
  }

  const { saveMediaEdit } = createMediaEditSaveBindings({
    status: options.status,
    getActiveItem: options.getActiveItem,
    getBaseDraft: options.getBaseDraft,
    getLocalizedMessage: options.getLocalizedMessage,
    ensureCategory: options.ensureCategory,
    readDraftFromForm: options.readDraftFromForm,
    validateDraft: options.validateDraft,
    setSaveButtonDisabled: options.setSaveButtonDisabled,
    setSaveBusyState: setMediaEditSaveBusyState,
    updateNotice: options.updateNotice,
    applyDraftToMediaItem: options.applyDraftToMediaItem,
    uploadThumbnail: uploadMediaEditThumbnailIfNeeded,
    deleteThumbnail: deleteMediaEditThumbnailIfNeeded,
    persistWorkingMedia: persistMediaEditForCurrentPlaylist,
    finalizeSave: finalizeMediaEditSave,
    failSave: failMediaEditSave,
  });

  return {
    saveMediaEdit,
    persistMediaEditForCurrentPlaylist,
  };
}
