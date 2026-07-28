export interface PlaylistStartupAmbientData {
  currentPlaylist?: string;
  isCloud?: boolean;
  playlists?: Record<string, unknown>;
}

export interface PlaylistStartupResumeContext<TMediaContext> {
  category?: string | null;
  media?: TMediaContext | null;
  playlist: string;
}

export type PlaylistStartupAction<TMediaContext> =
  | {
      type: 'resume';
      category: string | null;
      media: TMediaContext | null;
      playlist: string;
    }
  | {
      type: 'autoload_myplaylist';
    }
  | {
      type: 'autoload_current_playlist';
      playlist: string;
    }
  | {
      type: 'ready';
    };

export interface EnsureMyPlaylistOptionOptions {
  hasStoredMyPlaylist: boolean;
  isCloud: boolean;
  myPlaylistName: string;
  selectElement: HTMLSelectElement | null;
}

export function ensureMyPlaylistOptionFromStorage(options: EnsureMyPlaylistOptionOptions): boolean {
  if (!options.isCloud || !options.hasStoredMyPlaylist) {
    return false;
  }

  const selectElement = options.selectElement;
  if (!selectElement) {
    return true;
  }

  const alreadyExists = Array.from(selectElement.options).some((opt) => opt.value === options.myPlaylistName);
  if (alreadyExists) {
    return true;
  }

  const option = document.createElement('option');
  option.value = options.myPlaylistName;
  option.textContent = options.myPlaylistName.replace(/\.json$/i, '');
  selectElement.appendChild(option);
  return true;
}

export function removeMyPlaylistOption(selectElement: HTMLSelectElement | null, myPlaylistName: string): void {
  if (!selectElement) {
    return;
  }

  Array.from(selectElement.options).find((opt) => opt.value === myPlaylistName)?.remove();
  if (selectElement.value === myPlaylistName) {
    selectElement.selectedIndex = 0;
  }
}

export function resolveInitialPlaylistStartup<TMediaContext>(options: {
  ambientData: PlaylistStartupAmbientData | null | undefined;
  hasStoredMyPlaylist: boolean;
  isPlaylistAvailableForResume(playlist: string): boolean;
  myPlaylistName: string;
  savedPlaylistContext: PlaylistStartupResumeContext<TMediaContext> | null;
}): PlaylistStartupAction<TMediaContext> {
  const ambientData = options.ambientData;
  if (!ambientData) {
    return { type: 'ready' };
  }

  const savedPlaylistContext = options.savedPlaylistContext;
  if (
    savedPlaylistContext &&
    (!ambientData.isCloud || savedPlaylistContext.playlist === options.myPlaylistName) &&
    options.isPlaylistAvailableForResume(savedPlaylistContext.playlist)
  ) {
    return {
      type: 'resume',
      category: savedPlaylistContext.category ?? null,
      media: savedPlaylistContext.media ?? null,
      playlist: savedPlaylistContext.playlist,
    };
  }

  if (ambientData.isCloud === true && options.hasStoredMyPlaylist) {
    return { type: 'autoload_myplaylist' };
  }

  if (typeof ambientData.currentPlaylist === 'string' && ambientData.currentPlaylist.length > 0) {
    return {
      type: 'autoload_current_playlist',
      playlist: ambientData.currentPlaylist,
    };
  }

  return { type: 'ready' };
}
