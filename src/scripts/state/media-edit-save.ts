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
