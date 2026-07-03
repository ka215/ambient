import { writeMyPlaylistJson } from './myplaylist-storage';

export interface PlaylistImportSuccess {
  ok: true;
  filename: string;
  message: string;
}

export interface PlaylistImportFailure {
  ok: false;
  message: string;
}

export type PlaylistImportPersistResult = PlaylistImportSuccess | PlaylistImportFailure;

export function persistImportedCloudPlaylist(playlist: Record<string, unknown>): boolean {
  try {
    writeMyPlaylistJson(JSON.stringify(playlist, null, 2));
    return true;
  } catch (_error) {
    return false;
  }
}

export function resolveImportedPlaylistPersistResult(
  response: { state?: string; data?: { message?: string; filename?: string } } | null | undefined,
  fallbackErrorMessage: string,
  fallbackSuccessMessage: string
): PlaylistImportPersistResult {
  if (!response || response.state !== 'ok' || !response.data?.filename) {
    return {
      ok: false,
      message: response?.data?.message || fallbackErrorMessage,
    };
  }

  return {
    ok: true,
    filename: response.data.filename,
    message: response.data.message || fallbackSuccessMessage,
  };
}
