import { ensureManagementTargetPlaylist } from './management-target-playlist';

type LoggerFunction = (...args: unknown[]) => void;

export interface CreateManagementRuntimeSupportOptions {
  fetchData(
    endpointURL: string,
    method?: string,
    payload?: Record<string, string>,
    responseType?: string,
    timeoutMs?: number,
    logger?: LoggerFunction
  ): Promise<unknown>;
  logger: LoggerFunction;
  baseUrl: string;
  status: AMP_STATUS;
  selectPlaylist: HTMLSelectElement | null;
  myPlaylistName: string;
  document: Document;
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
  sanitizeText(value: string, maxLength: number): string;
  sanitizeDesc(value: string, maxLength?: number): string;
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
  postImportedPlaylist(options: {
    baseUrl: string;
    filename: string;
    playlist: Record<string, unknown>;
  }): Promise<unknown>;
  inArray(contains: unknown | unknown[], targetArray: unknown[], atLeastOne?: boolean): boolean;
  isVolumeInRange(value: number, min: number, max: number): boolean;
}

export interface ManagementRuntimeSupport {
  fetchRelativeFilepathData(url: string): Promise<unknown>;
  fetchPlaylistBindingData(
    endpointURL: string,
    method?: string,
    payload?: Record<string, string>
  ): Promise<unknown>;
  sanitizeImportedPlaylist(
    source: Record<string, unknown>,
    stripPlaylistTemplate: boolean
  ): { playlist: Record<string, unknown> } | null;
  postImportedPlaylist(baseUrl: string, filename: string, playlist: Record<string, unknown>): Promise<unknown>;
  ensureTargetPlaylist(): void;
  inArray(contains: unknown | unknown[], targetArray: unknown[], atLeastOne?: boolean): boolean;
  isVolumeInRange(value: number): boolean;
}

export function createManagementRuntimeSupport(
  options: CreateManagementRuntimeSupportOptions
): ManagementRuntimeSupport {
  return {
    fetchRelativeFilepathData: (url) => options.fetchData(url),
    fetchPlaylistBindingData: (endpointURL, method, payload) => {
      return options.fetchData(endpointURL, method, payload, 'json', 15000, options.logger);
    },
    sanitizeImportedPlaylist: (source, stripPlaylistTemplate) => {
      return options.sanitizeAndNormalizeImportPlaylist(source, stripPlaylistTemplate, {
        sanitizeText: options.sanitizeText,
        sanitizeDesc: options.sanitizeDesc,
        titleMaxLength: options.titleMaxLength,
        artistMaxLength: options.artistMaxLength,
        descMaxLength: options.descMaxLength,
      });
    },
    postImportedPlaylist: (baseUrl, filename, playlist) => {
      return options.postImportedPlaylist({ baseUrl, filename, playlist });
    },
    ensureTargetPlaylist: () => {
      ensureManagementTargetPlaylist({
        status: options.status,
        selectElement: options.selectPlaylist,
        myPlaylistName: options.myPlaylistName,
        document: options.document,
      });
    },
    inArray: (contains, targetArray, atLeastOne = false) => {
      return options.inArray(contains, targetArray, atLeastOne);
    },
    isVolumeInRange: (value) => options.isVolumeInRange(value, 0, 100),
  };
}
