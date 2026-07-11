import type { PlaylistResumeMediaContext } from '../state/playlist-context';
import { ensureSelectOption, selectExistingOption } from '../ui/forms/management-forms';
import { createImportedPlaylistActivator } from './imported-playlist-init';
import { executeInitialPlaylistStartup } from './playlist-startup-init';
import { resolveInitialPlaylistStartup } from './playlist-startup';

export interface InitializePlaylistStartupRuntimeOptions {
  ambientData: {
    currentPlaylist?: string;
    isCloud?: boolean;
    playlists?: Record<string, unknown>;
  } | null;
  hasStoredMyPlaylist: boolean;
  isPlaylistAvailableForResume(playlist: string): boolean;
  myPlaylistName: string;
  savedPlaylistContext: {
    category?: string | null;
    media?: PlaylistResumeMediaContext | null;
    playlist: string;
  } | null;
  requestCategoryResume(category: string | null): void;
  requestMediaResume(media: PlaylistResumeMediaContext | null): void;
  selectElement: HTMLSelectElement | null;
  loadPlaylist(playlist: string, preserveOptionsDuringLoad?: boolean): Promise<void>;
  initMyPlaylistFromStorage(): void;
  setPlaylistReadyState(isReady: boolean): void;
  releaseAppBoot(): void;
}

export function initializePlaylistStartupRuntime(
  options: InitializePlaylistStartupRuntimeOptions
): {
  activateImportedPlaylist(playlistName: string): Promise<void>;
} {
  const initialPlaylistStartup = resolveInitialPlaylistStartup<PlaylistResumeMediaContext>({
    ambientData: options.ambientData,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    isPlaylistAvailableForResume: options.isPlaylistAvailableForResume,
    myPlaylistName: options.myPlaylistName,
    savedPlaylistContext: options.savedPlaylistContext,
  });

  executeInitialPlaylistStartup({
    action: initialPlaylistStartup,
    requestCategoryResume: options.requestCategoryResume,
    requestMediaResume: options.requestMediaResume,
    selectPlaylistOption: (playlist) => {
      selectExistingOption(options.selectElement, playlist);
    },
    loadPlaylist: (playlist) => options.loadPlaylist(playlist),
    initMyPlaylistFromStorage: options.initMyPlaylistFromStorage,
    setPlaylistReadyState: options.setPlaylistReadyState,
    releaseAppBoot: options.releaseAppBoot,
  });

  const activateImportedPlaylist = createImportedPlaylistActivator({
    ensurePlaylistOption: (nextPlaylistName) => {
      ensureSelectOption(
        options.selectElement,
        nextPlaylistName,
        nextPlaylistName.replace(/\.json$/i, '')
      );
    },
    selectPlaylistOption: (nextPlaylistName) => {
      selectExistingOption(options.selectElement, nextPlaylistName);
    },
    requestCategoryResume: options.requestCategoryResume,
    requestMediaResume: () => {
      options.requestMediaResume(null);
    },
    loadPlaylist: (playlistName, preserveOptionsDuringLoad) => {
      return options.loadPlaylist(playlistName, preserveOptionsDuringLoad);
    },
  });

  return { activateImportedPlaylist };
}
