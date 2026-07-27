import { getUserData, PLAYLIST_CONTEXT_KEY, saveUserData } from '../platform/storage';
import { isObject } from '../shared/validation';

export interface PlaylistResumeMediaContext {
  amId: number;
  category: string;
  title: string;
  artist: string;
  file: string;
  videoid: string;
}

export interface PlaylistResumeContext {
  playlist: string;
  category: string;
  media: PlaylistResumeMediaContext | null;
}

export interface PlaylistResumeController {
  applyPendingCategoryResume(categories: string[] | null): number;
  applyPendingMediaResume(
    mediaItems: Array<{
      amId: number;
      artist?: string;
      catId: number;
      file?: string;
      title: string;
      videoid?: string;
    }>,
    getMediaCategoryName: (item: { catId: number }) => string,
    sanitizeTitle: (value: string) => string,
    sanitizeArtist: (value: string) => string
  ): number | null;
  createResumeMediaContext(
    mediaItem: {
      amId: number;
      artist?: string;
      file?: string;
      title: string;
      videoid?: string;
    } | null,
    currentCategoryName: string,
    mediaCategoryName: string,
    sanitizeTitle: (value: string) => string,
    sanitizeArtist: (value: string) => string
  ): PlaylistResumeMediaContext | null;
  requestCategoryResume(categoryName: string | null | undefined): void;
  requestMediaResume(mediaContext: PlaylistResumeMediaContext | null | undefined): void;
}

export function savePlaylistResumeContext(context: PlaylistResumeContext): boolean {
  return saveUserData(PLAYLIST_CONTEXT_KEY, context);
}

export function getSavedPlaylistResumeContext(
  sanitizeText: (value: string, maxLength: number) => string,
  titleMaxLength: number,
  artistMaxLength: number
): PlaylistResumeContext | null {
  const context = getUserData(PLAYLIST_CONTEXT_KEY);
  if (!isObject(context)) {
    return null;
  }
  const playlist = typeof context['playlist'] === 'string' ? context['playlist'].trim() : '';
  const category = typeof context['category'] === 'string' ? context['category'].trim() : '';
  if (playlist === '') {
    return null;
  }
  let media: PlaylistResumeMediaContext | null = null;
  if (isObject(context['media'])) {
    const source = context['media'] as Record<string, unknown>;
    const amId = Number(source['amId']);
    if (Number.isInteger(amId) && amId >= 0) {
      media = {
        amId,
        category: typeof source['category'] === 'string' ? source['category'].trim() : '',
        title: typeof source['title'] === 'string' ? sanitizeText(source['title'], titleMaxLength) : '',
        artist: typeof source['artist'] === 'string' ? sanitizeText(source['artist'], artistMaxLength) : '',
        file: typeof source['file'] === 'string' ? source['file'] : '',
        videoid: typeof source['videoid'] === 'string' ? source['videoid'] : '',
      };
    }
  }
  return { playlist, category, media };
}

export function createPlaylistResumeController(): PlaylistResumeController {
  let pendingResumeCategoryName: string | null = null;
  let pendingResumeMediaContext: PlaylistResumeMediaContext | null = null;

  const isSameResumeMedia = (
    item: {
      artist?: string;
      file?: string;
      title: string;
      videoid?: string;
    },
    mediaContext: PlaylistResumeMediaContext,
    sanitizeTitle: (value: string) => string,
    sanitizeArtist: (value: string) => string
  ): boolean => {
    const sameVideo = mediaContext.videoid !== '' && item.videoid === mediaContext.videoid;
    const sameFile = mediaContext.file !== '' && item.file === mediaContext.file;
    const sameTitle = sanitizeTitle(item.title || '') === mediaContext.title;
    const sameArtist = sanitizeArtist(item.artist || '') === mediaContext.artist;
    return sameVideo || sameFile || (sameTitle && sameArtist);
  };

  return {
    createResumeMediaContext(
      mediaItem,
      currentCategoryName,
      mediaCategoryName,
      sanitizeTitle,
      sanitizeArtist
    ): PlaylistResumeMediaContext | null {
      if (!mediaItem) {
        return null;
      }
      if (currentCategoryName !== '' && mediaCategoryName !== currentCategoryName) {
        return null;
      }
      return {
        amId: mediaItem.amId,
        category: mediaCategoryName,
        title: sanitizeTitle(mediaItem.title || ''),
        artist: sanitizeArtist(mediaItem.artist || ''),
        file: typeof mediaItem.file === 'string' ? mediaItem.file : '',
        videoid: typeof mediaItem.videoid === 'string' ? mediaItem.videoid : '',
      };
    },
    requestCategoryResume(categoryName: string | null | undefined): void {
      pendingResumeCategoryName = categoryName && categoryName.trim() !== '' ? categoryName.trim() : null;
    },
    requestMediaResume(mediaContext: PlaylistResumeMediaContext | null | undefined): void {
      pendingResumeMediaContext = mediaContext || null;
    },
    applyPendingCategoryResume(categories: string[] | null): number {
      if (pendingResumeCategoryName === null) {
        return -1;
      }
      const nextCategoryId = Array.isArray(categories)
        ? categories.indexOf(pendingResumeCategoryName)
        : -1;
      pendingResumeCategoryName = null;
      return nextCategoryId >= 0 ? nextCategoryId : -1;
    },
    applyPendingMediaResume(mediaItems, getMediaCategoryName, sanitizeTitle, sanitizeArtist): number | null {
      if (pendingResumeMediaContext === null) {
        return null;
      }
      const mediaContext = pendingResumeMediaContext;
      const expectedCategory = mediaContext.category || pendingResumeCategoryName || '';
      const isCategoryCompatible = (item: { catId: number }): boolean => {
        if (expectedCategory === '') {
          return true;
        }
        return getMediaCategoryName(item) === expectedCategory;
      };

      const exactAmId = mediaItems.find((item) =>
        item.amId === mediaContext.amId &&
        isCategoryCompatible(item) &&
        isSameResumeMedia(item, mediaContext, sanitizeTitle, sanitizeArtist)
      );
      const resumeItem = exactAmId || mediaItems.find((item) =>
        isCategoryCompatible(item) &&
        isSameResumeMedia(item, mediaContext, sanitizeTitle, sanitizeArtist)
      ) || null;
      pendingResumeMediaContext = null;
      return resumeItem ? resumeItem.amId : null;
    },
  };
}
