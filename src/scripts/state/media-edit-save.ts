import type { MediaItem } from '../types/ambient';

export type MediaEditSaveResult =
  | {
    ok: true;
    workingMedia: MediaItem[];
    updatedItem: MediaItem;
    persistMessage: string;
  }
  | {
    ok: false;
    message: string;
  };

export type MediaEditValidationGateResult =
  | {
    ok: true;
  }
  | {
    ok: false;
    message: string;
    delay: number;
  };

export function resolveMediaEditValidationGate(options: {
  valid: boolean;
  invalidMessage: string;
}): MediaEditValidationGateResult {
  if (options.valid) {
    return { ok: true };
  }
  return {
    ok: false,
    message: options.invalidMessage,
    delay: 2400,
  };
}

export function prepareMediaEditSaveExecution(options: {
  mediaItems: MediaItem[] | null | undefined;
  activeMediaId: number | null | undefined;
  updatedItemFactory: (item: MediaItem) => MediaItem;
}): {
  workingMedia: MediaItem[];
  updatedItem: MediaItem;
} | null {
  if (!Array.isArray(options.mediaItems) || !Number.isInteger(options.activeMediaId)) {
    return null;
  }
  const workingMedia = options.mediaItems.map((item) => ({ ...item }));
  const targetIndex = workingMedia.findIndex((item) => item.amId === options.activeMediaId);
  if (targetIndex < 0) {
    return null;
  }
  const targetItem = workingMedia[targetIndex];
  if (!targetItem) {
    return null;
  }
  const updatedItem = options.updatedItemFactory(targetItem);
  workingMedia[targetIndex] = updatedItem;
  return {
    workingMedia,
    updatedItem,
  };
}

export async function executeMediaEditSavePipeline(options: {
  workingMedia: MediaItem[];
  updatedItem: MediaItem;
  uploadThumbnail: () => Promise<{ ok: boolean; message: string }>;
  deleteThumbnail: () => Promise<{ ok: boolean; message: string }>;
  persistWorkingMedia: (workingMedia: MediaItem[]) => Promise<{ ok: boolean; message: string }>;
}): Promise<MediaEditSaveResult> {
  const uploadResult = await options.uploadThumbnail();
  if (!uploadResult.ok) {
    return {
      ok: false,
      message: uploadResult.message,
    };
  }

  const deleteResult = await options.deleteThumbnail();
  if (!deleteResult.ok) {
    return {
      ok: false,
      message: deleteResult.message,
    };
  }

  const persistResult = await options.persistWorkingMedia(options.workingMedia);
  if (!persistResult.ok) {
    return {
      ok: false,
      message: persistResult.message,
    };
  }

  return {
    ok: true,
    workingMedia: options.workingMedia,
    updatedItem: options.updatedItem,
    persistMessage: persistResult.message,
  };
}
