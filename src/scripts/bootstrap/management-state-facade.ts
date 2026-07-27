import type { MediaItem } from '../types/ambient';

export interface CreateManagementStateFacadeOptions {
  status: {
    addtype?: string | null;
    media: MediaItem[] | null;
    category: string[] | null;
    playlist: string | null;
    options: Record<string, unknown> | null;
  };
  buildPlaylistJson(seekFormat: boolean): string;
}

export interface ManagementStateFacade {
  getAddType(): string | null | undefined;
  setAddType(nextType: string): void;
  getMediaItems(): MediaItem[];
  getCategories(): string[];
  setCategories(categories: string[]): void;
  setMediaItems(mediaItems: MediaItem[]): void;
  getPlaylistName(): string;
  generatePlaylistJson(seekFormat: boolean): string;
}

export function createManagementStateFacade(options: CreateManagementStateFacadeOptions): ManagementStateFacade {
  return {
    getAddType: () => options.status.addtype,
    setAddType: (nextType) => {
      options.status.addtype = nextType;
    },
    getMediaItems: () => options.status.media || [],
    getCategories: () => options.status.category || [],
    setCategories: (categories) => {
      options.status.category = categories;
    },
    setMediaItems: (mediaItems) => {
      options.status.media = mediaItems;
    },
    getPlaylistName: () => options.status.playlist || 'playlist.json',
    generatePlaylistJson: (seekFormat) => options.buildPlaylistJson(seekFormat),
  };
}
