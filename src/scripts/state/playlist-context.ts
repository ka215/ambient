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
