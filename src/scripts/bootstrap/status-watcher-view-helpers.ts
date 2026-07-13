import { scrollPlaylistToCurrentFocus, syncPlaylistCurrentFocus } from '../ui/playlist-view';
import { syncPlaybackButtons } from '../ui/player/player-shell';

export interface CreateStatusWatcherViewHelpersOptions {
  playlistList: HTMLElement;
  getCurrentMediaId(): number | null;
  playButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  hasMediaItems(): boolean;
}

export interface StatusWatcherViewHelpers {
  syncPlaylistCurrentFocus(): void;
  scrollPlaylistToCurrentFocus(): void;
  syncPlaybackButtons(): void;
}

export function createStatusWatcherViewHelpers(
  options: CreateStatusWatcherViewHelpersOptions
): StatusWatcherViewHelpers {
  return {
    syncPlaylistCurrentFocus: () => {
      syncPlaylistCurrentFocus(options.playlistList, options.getCurrentMediaId());
    },
    scrollPlaylistToCurrentFocus: () => {
      scrollPlaylistToCurrentFocus(options.playlistList);
    },
    syncPlaybackButtons: () => {
      if (!options.playButton || !options.pauseButton) {
        return;
      }
      syncPlaybackButtons(options.playButton, options.pauseButton, options.hasMediaItems());
    },
  };
}
