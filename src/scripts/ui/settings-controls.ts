export interface SelectorControlBindings {
  playlistSelect: HTMLSelectElement | null;
  categorySelect: HTMLSelectElement | null;
  languageSelect: HTMLSelectElement | null;
  onPlaylistChange(evt: Event): void;
  onCategoryChange(evt: Event): void;
  onLanguageChange(evt: Event): void;
}

export interface SettingsControlBindings {
  loopToggle: HTMLInputElement | null;
  randomlyToggle: HTMLInputElement | null;
  shuffleToggle: HTMLInputElement | null;
  seekplayToggle: HTMLInputElement | null;
  faderToggle: HTMLInputElement | null;
  darkmodeToggle: HTMLInputElement | null;
  volumeRange: HTMLInputElement | null;
  onLoopChange(evt: Event): void;
  onRandomlyChange(evt: Event): void;
  onShuffleChange(evt: Event): void;
  onSeekplayChange(evt: Event): void;
  onFaderChange(evt: Event): void;
  onDarkmodeChange(evt: Event): void;
  onVolumeInput(evt: Event): void;
  onVolumeChange(evt: Event): void;
}

export function bindSelectorControls(bindings: SelectorControlBindings): void {
  bindings.playlistSelect?.addEventListener('change', bindings.onPlaylistChange);
  bindings.categorySelect?.addEventListener('change', bindings.onCategoryChange);
  bindings.languageSelect?.addEventListener('change', bindings.onLanguageChange);
}

export function bindSettingsControls(bindings: SettingsControlBindings): void {
  bindings.loopToggle?.addEventListener('change', bindings.onLoopChange);
  bindings.randomlyToggle?.addEventListener('change', bindings.onRandomlyChange);
  bindings.shuffleToggle?.addEventListener('change', bindings.onShuffleChange);
  bindings.seekplayToggle?.addEventListener('change', bindings.onSeekplayChange);
  bindings.faderToggle?.addEventListener('change', bindings.onFaderChange);
  bindings.darkmodeToggle?.addEventListener('change', bindings.onDarkmodeChange);
  bindings.volumeRange?.addEventListener('input', bindings.onVolumeInput);
  bindings.volumeRange?.addEventListener('change', bindings.onVolumeChange);
}
