type PlaylistOptionRecord = Record<string, unknown>;

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
