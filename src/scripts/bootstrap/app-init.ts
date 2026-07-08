import { watcher } from '../shared/dom-utils';
import { cleanupDrawerBackdrops, syncDrawerAndModalBackdrops } from '../ui/drawers';
import { bindAmbientPlayerControls } from '../ui/player-control-bindings';
import { bindAmbientPlaylistInteractionControls } from '../ui/playlist-interaction-bindings';
import { bindAmbientSelectorControls } from '../ui/selector-bindings';
import { bindAmbientSettingsControls } from '../ui/settings-bindings';
import { getToggleInput } from '../ui/settings-view';
import { bindViewportSyncEvents } from '../ui/viewport';

type SelectorControlBindings = Parameters<typeof bindAmbientSelectorControls>[0];
type PlaylistInteractionBindings = Parameters<typeof bindAmbientPlaylistInteractionControls>[0];
type PlayerControlBindings = Parameters<typeof bindAmbientPlayerControls>[0];
type SettingsControlBindings = Parameters<typeof bindAmbientSettingsControls>[0];

export interface AmbientAppControlBindingsOptions {
  selectorControls: SelectorControlBindings;
  playlistInteractionControls: PlaylistInteractionBindings;
  playerControls: PlayerControlBindings;
  settingsControlRoots: {
    loop: HTMLElement | null;
    randomly: HTMLElement | null;
    shuffle: HTMLElement | null;
    seekplay: HTMLElement | null;
    fader: HTMLElement | null;
    darkmode: HTMLElement | null;
  };
  settingsControls: Omit<
    SettingsControlBindings,
    'loopToggle' | 'randomlyToggle' | 'shuffleToggle' | 'seekplayToggle' | 'faderToggle' | 'darkmodeToggle'
  >;
}

export interface AmbientViewportLifecycleOptions {
  drawerPlaylist: HTMLElement | null;
  drawerSettings: HTMLElement | null;
  modalOptions: HTMLElement | null;
  getCurrentWidth(): number;
  minFullUIWidth: number;
  setMenuMinimized(minimized: boolean): void;
  syncViewportMetrics(): void;
  updateWindowSize(): void;
  refreshViewportMetricsAfter(delayMs: number): void;
  scheduleViewportMetricsSync(delayMs: number): void;
}

export function bindAmbientAppControlBindings(options: AmbientAppControlBindingsOptions): void {
  bindAmbientSelectorControls(options.selectorControls);
  bindAmbientPlaylistInteractionControls(options.playlistInteractionControls);
  bindAmbientPlayerControls(options.playerControls);
  bindAmbientSettingsControls({
    ...options.settingsControls,
    loopToggle: getToggleInput(options.settingsControlRoots.loop),
    randomlyToggle: getToggleInput(options.settingsControlRoots.randomly),
    shuffleToggle: getToggleInput(options.settingsControlRoots.shuffle),
    seekplayToggle: getToggleInput(options.settingsControlRoots.seekplay),
    faderToggle: getToggleInput(options.settingsControlRoots.fader),
    darkmodeToggle: getToggleInput(options.settingsControlRoots.darkmode),
  });
}

export function bindAmbientViewportLifecycle(options: AmbientViewportLifecycleOptions): void {
  const watchedElements = [options.drawerPlaylist, options.drawerSettings, options.modalOptions]
    .filter((element): element is HTMLElement => element instanceof HTMLElement);

  watcher(watchedElements, (mutation: MutationRecord) => {
    if (mutation.attributeName !== 'aria-modal') {
      return;
    }

    if ((mutation.target as HTMLElement).ariaModal === 'true') {
      syncDrawerAndModalBackdrops(options.getCurrentWidth(), options.minFullUIWidth);
      return;
    }

    cleanupDrawerBackdrops([options.drawerPlaylist, options.drawerSettings]);
  });

  options.setMenuMinimized(false);
  options.syncViewportMetrics();

  bindViewportSyncEvents({
    onResizeSettled: () => {
      options.syncViewportMetrics();
      options.updateWindowSize();
    },
    onOrientationChange: () => {
      options.refreshViewportMetricsAfter(80);
      options.refreshViewportMetricsAfter(420);
    },
    onVisualViewportChange: () => {
      options.scheduleViewportMetricsSync(60);
    },
    onVisibilityRestore: () => {
      options.scheduleViewportMetricsSync(80);
    },
  });

  window.dispatchEvent(new Event('resize', { bubbles: true, cancelable: false }));
}
