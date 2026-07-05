import type { MediaItem } from '../types/ambient';

export interface PlaylistLoadGuard {
  begin(playlist: string, onBegin: (playlist: string) => void): number;
  finish(seq: number): void;
  isActive(seq: number): boolean;
  isLoading(): boolean;
}

export function createPlaylistLoadGuard(): PlaylistLoadGuard {
  let playlistLoadSeq = 0;
  let activePlaylistLoadSeq = 0;

  return {
    begin(playlist: string, onBegin: (playlist: string) => void): number {
      const nextSeq = ++playlistLoadSeq;
      activePlaylistLoadSeq = nextSeq;
      onBegin(playlist);
      return nextSeq;
    },
    finish(seq: number): void {
      if (activePlaylistLoadSeq === seq) {
        activePlaylistLoadSeq = 0;
      }
    },
    isActive(seq: number): boolean {
      return activePlaylistLoadSeq === seq;
    },
    isLoading(): boolean {
      return activePlaylistLoadSeq !== 0;
    },
  };
}

export function resetPlaylistRuntimeStatus<TStatus extends {
  prev: number | null;
  current: number | null;
  next: number | null;
  ctg: number | null;
  category: string[] | null;
  media: MediaItem[] | null;
  options: unknown;
}>(status: TStatus, preserveOptions = false): void {
  status.prev = null;
  status.current = null;
  status.next = null;
  status.ctg = -1;
  status.category = null;
  status.media = [];
  if (!preserveOptions) {
    status.options = null;
  }
}

export function materializeCategorizedMedia(data: Record<string, MediaItem[]>): {
  categories: string[];
  media: MediaItem[];
} {
  let media: MediaItem[] = [];
  const categories = Object.keys(data);

  categories.forEach((category: string, cid: number) => {
    if (data[category] && data[category].length > 0) {
      media = media.concat(
        data[category].map((item: MediaItem) => ({
          ...item,
          catId: cid,
        }))
      );
    }
  });

  return { categories, media };
}

export function assignSequentialMediaIds(media: MediaItem[]): MediaItem[] {
  let amid = 0;
  return media
    .filter((item: MediaItem) => item.hasOwnProperty('title') && item.title !== '')
    .map((item: MediaItem) => ({
      ...item,
      amId: amid++,
    }));
}
