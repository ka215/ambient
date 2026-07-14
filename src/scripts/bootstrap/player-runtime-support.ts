export interface CreatePlayerRuntimeSupportOptions {
  sanitizeMediaText(value: string, maxLength: number): string;
  mediaTitleMaxLength: number;
  mediaArtistMaxLength: number;
}

export interface PlayerRuntimeSupport {
  sanitizeTitle(value: string): string;
  sanitizeArtist(value: string): string;
}

export function createPlayerRuntimeSupport(
  options: CreatePlayerRuntimeSupportOptions
): PlayerRuntimeSupport {
  return {
    sanitizeTitle: (value) => options.sanitizeMediaText(value, options.mediaTitleMaxLength),
    sanitizeArtist: (value) => options.sanitizeMediaText(value, options.mediaArtistMaxLength),
  };
}
