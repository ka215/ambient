import { bindAmbientStatusWatchers } from '../state/status-watchers';

export interface InitializeStatusWatcherOptions {
  status: Record<string, unknown>;
  runtimeLogger(...args: unknown[]): void;
  saveStorageAdapter(prop: string, value: unknown, logger: (...args: unknown[]) => void): void;
  savePlaylistContext(): void;
  syncPlaylistCurrentFocus(): void;
  scrollPlaylistToCurrentFocus(): void;
  syncRandomOrderToggle(): void;
  syncPlaybackButtons(): void;
  updatePlaylistCategory(): void;
  syncShuffleState(): void;
  syncVolumeState(): void;
  updateNotice(notification: unknown): void;
  applyDisplayOptions(): void;
  syncYouTubeSignalAttrs(): void;
}

export function initializeStatusWatcher(options: InitializeStatusWatcherOptions): void {
  bindAmbientStatusWatchers({
    status: options.status,
    onPropertyChange: (prop, _oldValue, newValue) => {
      switch (true) {
        case /^(prev|current|next|ctg|order|loop)$/i.test(prop):
          options.saveStorageAdapter(prop, newValue, options.runtimeLogger);
          if (/^ctg$/i.test(prop)) {
            options.savePlaylistContext();
          }
          if ('current' === prop) {
            options.syncPlaylistCurrentFocus();
            options.scrollPlaylistToCurrentFocus();
            options.savePlaylistContext();
          }
          if ('order' === prop) {
            options.syncRandomOrderToggle();
          }
          break;
        case /^playlist$/i.test(prop):
          options.savePlaylistContext();
          break;
        case /^media$/i.test(prop):
          options.syncPlaybackButtons();
          break;
        case /^category$/i.test(prop):
          options.updatePlaylistCategory();
          break;
        case /^shuffle$/i.test(prop):
          options.syncShuffleState();
          break;
        case /^volume$/i.test(prop):
          options.syncVolumeState();
          break;
        case /^notice$/i.test(prop):
          if (newValue) {
            options.updateNotice(newValue);
          }
          break;
        case /^options$/i.test(prop):
          options.applyDisplayOptions();
          break;
        case /^yt_(phase|seq|error)$/i.test(prop):
          options.syncYouTubeSignalAttrs();
          break;
      }
    },
  });
}
