type PlaylistOptionRecord = Record<string, unknown>;

export interface PlaylistOptionState {
  backgroundImage: string | null;
  hasRandom: boolean;
  randomEnabled: boolean;
  hasShuffle: boolean;
  shuffleEnabled: boolean;
  hasSeek: boolean;
  seekEnabled: boolean;
  hasFader: boolean;
  faderEnabled: boolean;
  hasDark: boolean;
  darkEnabled: boolean;
  fullWindowEnabled: boolean;
  volume: number;
}

export function readPlaylistOption<
  TOptions extends PlaylistOptionRecord,
  K extends keyof TOptions & string
>(
  status: { playlist: string | null; options: TOptions | null },
  key: K,
  myPlaylistName: string
): Exclude<TOptions[K], undefined> | null {
  if (status.playlist === myPlaylistName && key === 'playlist') {
    return null;
  }

  if (!status.options || !Object.prototype.hasOwnProperty.call(status.options, key)) {
    return null;
  }

  const value = status.options[key];
  if (value === null || value === '' || value === undefined) {
    return null;
  }

  return value as Exclude<TOptions[K], undefined>;
}

export function setPlaylistOption<K extends string, TValue>(
  status: { options: PlaylistOptionRecord | null },
  key: K,
  value: TValue
): PlaylistOptionRecord {
  if (!status.options) {
    status.options = { [key]: value };
    return status.options;
  }

  status.options[key] = value;
  return status.options;
}

export function resolvePlaylistOptionState(options: {
  getOption: <TKey extends string>(key: TKey) => unknown;
  defaultVolume: number;
}): PlaylistOptionState {
  const backgroundImage = options.getOption('background');
  const random = options.getOption('random');
  const shuffle = options.getOption('shuffle');
  const seek = options.getOption('seek');
  const fader = options.getOption('fader');
  const dark = options.getOption('dark');
  const fullwindow = options.getOption('fullwindow');
  const volume = options.getOption('volume');

  return {
    backgroundImage: typeof backgroundImage === 'string' ? backgroundImage : null,
    hasRandom: random !== null,
    randomEnabled: Boolean(random),
    hasShuffle: shuffle !== null,
    shuffleEnabled: Boolean(shuffle),
    hasSeek: seek !== null,
    seekEnabled: Boolean(seek),
    hasFader: fader !== null,
    faderEnabled: Boolean(fader),
    hasDark: dark !== null,
    darkEnabled: Boolean(dark),
    fullWindowEnabled: Boolean(fullwindow),
    volume: typeof volume === 'number' ? volume : options.defaultVolume,
  };
}
