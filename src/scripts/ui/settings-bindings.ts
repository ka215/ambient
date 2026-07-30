import type { MediaItem } from '../types/ambient';
import { setPlaylistOption } from '../state/playlist-options';
import { bindSettingsControls } from './settings-controls';
import { applyDarkModeAppearance, syncVolumeSlider, updateNoMediaImagesForTheme } from './settings-view';

export function bindAmbientSettingsControls(options: {
  loopToggle: HTMLInputElement | null;
  randomlyToggle: HTMLInputElement | null;
  shuffleToggle: HTMLInputElement | null;
  seekplayToggle: HTMLInputElement | null;
  faderToggle: HTMLInputElement | null;
  darkmodeToggle: HTMLInputElement | null;
  volumeRange: HTMLInputElement | null;
  status: {
    loop?: boolean | null;
    order: 'random' | 'normal';
    shuffle?: MediaItem[] | null;
    volume: number | null;
    options: Record<string, unknown> | null;
  };
  shufflePlaylist(): MediaItem[];
  persistCurrentPlaylistSettings(): void;
  normalizeVolume(value: unknown): number;
  syncRangeProgress(range: HTMLInputElement | null): void;
  getDefaultVolumeDisplay(): HTMLElement | null;
  isDarkModeEnabled(): boolean;
  setStyles(targetElements: HTMLElement | HTMLElement[], styles?: string | Record<string, string>): void;
}): void {
  bindSettingsControls({
    loopToggle: options.loopToggle,
    randomlyToggle: options.randomlyToggle,
    shuffleToggle: options.shuffleToggle,
    seekplayToggle: options.seekplayToggle,
    faderToggle: options.faderToggle,
    darkmodeToggle: options.darkmodeToggle,
    volumeRange: options.volumeRange,
    onLoopChange: (evt: Event) => {
      options.status.loop = (evt.target as HTMLInputElement).checked;
    },
    onRandomlyChange: (evt: Event) => {
      const enabled = (evt.target as HTMLInputElement).checked;
      options.status.order = enabled ? 'random' : 'normal';
      setPlaylistOption(options.status, 'random', enabled);
      options.persistCurrentPlaylistSettings();
    },
    onShuffleChange: (evt: Event) => {
      setPlaylistOption(options.status, 'shuffle', (evt.target as HTMLInputElement).checked);
      options.status.shuffle = options.shufflePlaylist();
      options.persistCurrentPlaylistSettings();
    },
    onSeekplayChange: (evt: Event) => {
      setPlaylistOption(options.status, 'seek', (evt.target as HTMLInputElement).checked);
      options.persistCurrentPlaylistSettings();
    },
    onFaderChange: (evt: Event) => {
      setPlaylistOption(options.status, 'fader', (evt.target as HTMLInputElement).checked);
      options.persistCurrentPlaylistSettings();
    },
    onDarkmodeChange: (evt: Event) => {
      setPlaylistOption(options.status, 'dark', (evt.target as HTMLInputElement).checked);
      setTimeout(() => {
        const isDarkmode = options.status.options?.dark ? !!options.status.options.dark : false;
        applyDarkModeAppearance({
          enabled: isDarkmode,
          toggleInput: options.darkmodeToggle,
          updateNoMediaImagesForTheme: () => updateNoMediaImagesForTheme(options.isDarkModeEnabled()),
          setStyles: options.setStyles,
        });
      }, 200);
      options.persistCurrentPlaylistSettings();
    },
    onVolumeInput: (evt: Event) => {
      const currentVolume = options.normalizeVolume((evt.target as HTMLInputElement).value);
      syncVolumeSlider({
        input: evt.target as HTMLInputElement,
        volume: currentVolume,
        syncRangeProgress: options.syncRangeProgress,
        display: options.getDefaultVolumeDisplay(),
      });
    },
    onVolumeChange: (evt: Event) => {
      const currentVolume = options.normalizeVolume((evt.target as HTMLInputElement).value);
      syncVolumeSlider({
        input: evt.target as HTMLInputElement,
        volume: currentVolume,
        syncRangeProgress: options.syncRangeProgress,
        display: options.getDefaultVolumeDisplay(),
      });
      options.status.volume = currentVolume;
      setPlaylistOption(options.status, 'volume', currentVolume);
      options.persistCurrentPlaylistSettings();
    },
  });
}
