export interface CreateAmbientPlaylistSupportOptions {
  sanitizeMediaText(value: string, maxLength: number): string;
  sanitizeMediaDesc(value: string, maxLength?: number): string;
}

export interface AmbientPlaylistSupport {
  sanitizeText(value: string, maxLength: number): string;
  sanitizeDesc(value: string, maxLength?: number): string;
}

export function createAmbientPlaylistSupport(
  options: CreateAmbientPlaylistSupportOptions
): AmbientPlaylistSupport {
  return {
    sanitizeText: options.sanitizeMediaText,
    sanitizeDesc: options.sanitizeMediaDesc,
  };
}
