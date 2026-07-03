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

export async function postImportedPlaylist(options: {
  baseUrl: string;
  filename: string;
  playlist: Record<string, unknown>;
}): Promise<{ state?: string; data?: { message?: string; filename?: string } } | undefined> {
  try {
    const rawResponse = await fetch(`${options.baseUrl}playlist-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: options.filename,
        playlist: options.playlist,
      }),
      credentials: 'same-origin',
    });
    const payload = await rawResponse.json().catch(() => null);
    if (payload && typeof payload === 'object') {
      return payload as { state?: string; data?: { message?: string; filename?: string } };
    }
  } catch (_error) {
    return undefined;
  }

  return undefined;
}

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
