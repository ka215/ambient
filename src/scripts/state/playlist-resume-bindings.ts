import type { MediaItem } from '../types/ambient';
import {
  getSavedPlaylistResumeContext,
  type PlaylistResumeContext,
  type PlaylistResumeController,
  type PlaylistResumeMediaContext,
  savePlaylistResumeContext,
} from './playlist-context';

export function createPlaylistResumeBindings(options: {
  status: {
    playlist: string | null;
    ctg?: number | null;
    category: string[] | null;
    current: number | null;
    media: MediaItem[] | null;
  };
  playlistResume: PlaylistResumeController;
  sanitizeMediaText: (value: string, maxLength: number) => string;
  titleMaxLength: number;
  artistMaxLength: number;
  hasStoredMyPlaylist: () => boolean;
  isCloudMode: () => boolean;
  myPlaylistName: string;
  hasPlaylist: (playlist: string) => boolean;
  onCategoryResumeApplied: (nextCategoryId: number) => void;
  onMediaResumeApplied: (resumeAmId: number) => void;
}): {
  getMediaCategoryName: (mediaItem: MediaItem | null | undefined) => string;
  getSavedPlaylistContext: () => PlaylistResumeContext | null;
  savePlaylistContext: () => void;
  isPlaylistAvailableForResume: (playlist: string) => boolean;
  requestCategoryResume: (categoryName: string | null | undefined) => void;
  requestMediaResume: (mediaContext: PlaylistResumeMediaContext | null | undefined) => void;
  applyPendingCategoryResume: () => void;
  applyPendingMediaResume: () => boolean;
} {
  function getCurrentCategoryName(): string {
    const catId = Number(options.status.ctg);
    if (Number.isInteger(catId) && catId >= 0 && Array.isArray(options.status.category)) {
      return options.status.category[catId] || '';
    }
    return '';
  }

  function getMediaCategoryName(mediaItem: MediaItem | null | undefined): string {
    if (!mediaItem || !Array.isArray(options.status.category)) {
      return '';
    }
    return options.status.category[mediaItem.catId] || '';
  }

  function getCurrentMediaItem(): MediaItem | null {
    if (options.status.current === null || !Array.isArray(options.status.media)) {
      return null;
    }
    return options.status.media.find((item) => item.amId === options.status.current) || null;
  }

  function createResumeMediaContext(mediaItem: MediaItem | null): PlaylistResumeMediaContext | null {
    return options.playlistResume.createResumeMediaContext(
      mediaItem,
      getCurrentCategoryName(),
      getMediaCategoryName(mediaItem),
      (value) => options.sanitizeMediaText(value, options.titleMaxLength),
      (value) => options.sanitizeMediaText(value, options.artistMaxLength)
    );
  }

  function savePlaylistContext(): void {
    if (!options.status.playlist) {
      return;
    }
    savePlaylistResumeContext({
      playlist: options.status.playlist,
      category: getCurrentCategoryName(),
      media: createResumeMediaContext(getCurrentMediaItem()),
    });
  }

  function getSavedPlaylistContext(): PlaylistResumeContext | null {
    return getSavedPlaylistResumeContext(
      options.sanitizeMediaText,
      options.titleMaxLength,
      options.artistMaxLength
    );
  }

  function isPlaylistAvailableForResume(playlist: string): boolean {
    if (playlist === options.myPlaylistName) {
      return options.isCloudMode() && options.hasStoredMyPlaylist();
    }
    return options.hasPlaylist(playlist);
  }

  function requestCategoryResume(categoryName: string | null | undefined): void {
    options.playlistResume.requestCategoryResume(categoryName);
  }

  function requestMediaResume(mediaContext: PlaylistResumeMediaContext | null | undefined): void {
    options.playlistResume.requestMediaResume(mediaContext);
  }

  function applyPendingCategoryResume(): void {
    const nextCategoryId = options.playlistResume.applyPendingCategoryResume(options.status.category);
    options.onCategoryResumeApplied(nextCategoryId);
  }

  function applyPendingMediaResume(): boolean {
    const resumeAmId = options.playlistResume.applyPendingMediaResume(
      options.status.media || [],
      (item) => getMediaCategoryName(item as MediaItem),
      (value) => options.sanitizeMediaText(value, options.titleMaxLength),
      (value) => options.sanitizeMediaText(value, options.artistMaxLength)
    );
    if (resumeAmId === null) {
      return false;
    }
    options.onMediaResumeApplied(resumeAmId);
    return true;
  }

  return {
    getMediaCategoryName,
    getSavedPlaylistContext,
    savePlaylistContext,
    isPlaylistAvailableForResume,
    requestCategoryResume,
    requestMediaResume,
    applyPendingCategoryResume,
    applyPendingMediaResume,
  };
}
