import type { createManagementImportHelpers } from './management-import-init';

type ManagementImportHelperOptions = Parameters<typeof createManagementImportHelpers>[0];

export interface CreateManagementImportFacadeOptions {
  document: Document;
  baseUrl: string;
  fetchData(url: string): Promise<unknown>;
  getRuntimeAmbientData(): { isCloud?: boolean; playlists?: Record<string, unknown> } | null | undefined;
  isLikelyJsonFile(file: File): boolean;
  getLocalizedMessage(key: string, fallback: string): string;
  getCloudImportSizeLimitBytes(
    userAgent: string,
    limits: Record<'desktop' | 'tablet' | 'mobile' | 'unknown', number>
  ): number;
  cloudImportSizeLimitBytes: Record<'desktop' | 'tablet' | 'mobile' | 'unknown', number>;
  parseImportedPlaylistJson(text: string): unknown;
  validatePlaylistSchemaContract(value: unknown): boolean;
  sanitizeAndNormalizeImportPlaylist(
    source: Record<string, unknown>,
    stripPlaylistTemplate: boolean
  ): { playlist: Record<string, unknown> } | null;
  persistImportedCloudPlaylist(playlist: Record<string, unknown>): boolean;
  ensureMyPlaylistOptionFromStorage(): boolean;
  activateImportedPlaylist(playlistName: string): Promise<void>;
  myPlaylistName: string;
  postImportedPlaylist(baseUrl: string, filename: string, playlist: Record<string, unknown>): Promise<unknown>;
  resolveImportedPlaylistPersistResult(
    response: unknown,
    failureMessage: string,
    successMessage: string
  ): { ok: boolean; message: string; filename?: string };
  isObject(value: unknown): boolean;
  sanitizeText(value: string, maxLength: number): string;
  sanitizeDesc(value: string, maxLength?: number): string;
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
  logger(...args: unknown[]): void;
}

export function createManagementImportFacade(
  options: CreateManagementImportFacadeOptions
): ManagementImportHelperOptions {
  return {
    resolveRelativeFilepathOptions: {
      baseUrl: options.baseUrl,
      fetchData: async (url) => options.fetchData(url),
      filepathInput: options.document.getElementById('local-media-filepath') as HTMLInputElement | null,
      messageLabel: options.document.getElementById('note-error-local-media-file'),
      getDefaultMessage: (label) => String(label.getAttribute('data-default-message') ?? ''),
      logger: options.logger,
    },
    importPlaylistOptions: {
      ambientData: options.getRuntimeAmbientData(),
      isLikelyJsonFile: options.isLikelyJsonFile,
      getLocalizedMessage: options.getLocalizedMessage,
      getCloudImportSizeLimitBytes: options.getCloudImportSizeLimitBytes,
      cloudImportSizeLimitBytes: options.cloudImportSizeLimitBytes,
      parseImportedPlaylistJson: options.parseImportedPlaylistJson,
      validatePlaylistSchemaContract: options.validatePlaylistSchemaContract,
      sanitizeAndNormalizeImportPlaylist: (source, stripPlaylistTemplate) => ({
        playlist: options.sanitizeAndNormalizeImportPlaylist(source, stripPlaylistTemplate)?.playlist ?? null,
      }) as { playlist: Record<string, unknown> } | null,
      persistImportedCloudPlaylist: options.persistImportedCloudPlaylist,
      ensureMyPlaylistOptionFromStorage: options.ensureMyPlaylistOptionFromStorage,
      activateImportedPlaylist: options.activateImportedPlaylist,
      myPlaylistName: options.myPlaylistName,
      postImportedPlaylist: async (baseUrl, filename, playlist) => options.postImportedPlaylist(baseUrl, filename, playlist),
      baseUrl: options.baseUrl,
      resolveImportedPlaylistPersistResult: options.resolveImportedPlaylistPersistResult,
      getRuntimeAmbientData: options.getRuntimeAmbientData,
      ensureAmbientPlaylistMap: (ambient) => {
        if (!options.isObject(ambient.playlists)) {
          ambient.playlists = {};
        }
        return ambient.playlists as Record<string, unknown>;
      },
    },
  };
}
