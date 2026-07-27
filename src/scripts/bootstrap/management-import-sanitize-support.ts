export interface CreateManagementImportSanitizeSupportOptions {
  sanitizeAndNormalizeImportPlaylist(options: {
    source: Record<string, unknown>;
    stripPlaylistTemplate: boolean;
    sanitizeText(value: string, maxLength: number): string;
    sanitizeDesc(value: string, maxLength?: number): string;
    titleMaxLength: number;
    artistMaxLength: number;
    descMaxLength: number;
  }): { playlist: Record<string, unknown> } | null;
  sanitizeText(value: string, maxLength: number): string;
  sanitizeDesc(value: string, maxLength?: number): string;
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
}

export interface ManagementImportSanitizeSupport {
  sanitizeAndNormalizeImportPlaylist(
    source: Record<string, unknown>,
    stripPlaylistTemplate: boolean,
    options: {
      sanitizeText(value: string, maxLength: number): string;
      sanitizeDesc(value: string, maxLength?: number): string;
      titleMaxLength: number;
      artistMaxLength: number;
      descMaxLength: number;
    }
  ): { playlist: Record<string, unknown> } | null;
}

export function createManagementImportSanitizeSupport(
  options: CreateManagementImportSanitizeSupportOptions
): ManagementImportSanitizeSupport {
  return {
    sanitizeAndNormalizeImportPlaylist: (source, stripPlaylistTemplate) => {
      return options.sanitizeAndNormalizeImportPlaylist({
        source,
        stripPlaylistTemplate,
        sanitizeText: options.sanitizeText,
        sanitizeDesc: options.sanitizeDesc,
        titleMaxLength: options.titleMaxLength,
        artistMaxLength: options.artistMaxLength,
        descMaxLength: options.descMaxLength,
      });
    },
  };
}
