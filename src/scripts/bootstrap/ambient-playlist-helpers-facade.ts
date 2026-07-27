import type { MediaItem } from '../types/ambient';

export interface CreateAmbientPlaylistHelpersFacadeOptions {
  status: {
    media: MediaItem[] | null;
    category: string[] | null;
    options: Record<string, unknown> | null;
  };
  buildPlaylistJson(args: {
    mediaItems: MediaItem[];
    categories: string[];
    playlistOptions: Record<string, unknown> | null;
    seekFormat: boolean;
  }): string;
  sanitizeText(value: string, maxLength: number): string;
  sanitizeDesc(value: string, maxLength?: number): string;
}

export interface AmbientPlaylistHelpersFacade {
  generatePlaylistJson(seekFormat?: boolean): string;
  sanitizeMediaText(value: string, maxLength: number): string;
  sanitizeMediaDesc(value: string, maxLength?: number): string;
}

export function createAmbientPlaylistHelpersFacade(
  options: CreateAmbientPlaylistHelpersFacadeOptions
): AmbientPlaylistHelpersFacade {
  return {
    generatePlaylistJson: (seekFormat = false) => options.buildPlaylistJson({
      mediaItems: options.status.media || [],
      categories: options.status.category || [],
      playlistOptions: options.status.options,
      seekFormat,
    }),
    sanitizeMediaText: (value, maxLength) => options.sanitizeText(value, maxLength),
    sanitizeMediaDesc: (value, maxLength) => options.sanitizeDesc(value, maxLength),
  };
}
