export async function resolveManagementRelativeFilepath(options: {
  baseUrl: string;
  basefile: string;
  fetchData(url: string): Promise<unknown>;
  filepathInput: HTMLInputElement | null;
  messageLabel: HTMLElement | null;
  getDefaultMessage(label: HTMLElement): string;
  logger(...args: unknown[]): void;
}): Promise<boolean> {
  const endpointURL = `${options.baseUrl}filepath/${encodeURIComponent(options.basefile)}`;
  const response = await options.fetchData(endpointURL) as any;
  if (response && response.code == 200) {
    if (options.filepathInput) {
      options.filepathInput.value = decodeURIComponent(response.data);
    }
    if (options.messageLabel) {
      options.messageLabel.textContent = options.getDefaultMessage(options.messageLabel);
    }
  } else {
    if (options.filepathInput) {
      options.filepathInput.value = '';
    }
    if (options.messageLabel) {
      options.messageLabel.textContent = response?.data || '';
    }
  }
  options.logger('getRelativeFilepath:', endpointURL, response);
  return response && response.code == 200;
}

export async function importPlaylistFromManagementFile(options: {
  file: File;
  ambientData: { isCloud?: boolean; playlists?: Record<string, unknown> } | null | undefined;
  isLikelyJsonFile(file: File): boolean;
  getLocalizedMessage(key: string, fallback: string): string;
  getCloudImportSizeLimitBytes(
    userAgent: string,
    limits: Record<'desktop' | 'tablet' | 'mobile' | 'unknown', number>
  ): number;
  cloudImportSizeLimitBytes: Record<'desktop' | 'tablet' | 'mobile' | 'unknown', number>;
  parseImportedPlaylistJson(text: string): unknown;
  validatePlaylistSchemaContract(value: unknown): boolean;
  sanitizeAndNormalizeImportPlaylist(source: Record<string, unknown>, stripPlaylistTemplate: boolean): {
    playlist: Record<string, unknown>;
  } | null;
  persistImportedCloudPlaylist(playlist: Record<string, unknown>): boolean;
  ensureMyPlaylistOptionFromStorage(): boolean;
  activateImportedPlaylist(playlistName: string): Promise<void>;
  myPlaylistName: string;
  postImportedPlaylist(baseUrl: string, filename: string, playlist: Record<string, unknown>): Promise<unknown>;
  baseUrl: string;
  resolveImportedPlaylistPersistResult(
    response: unknown,
    failureMessage: string,
    successMessage: string
  ): { ok: boolean; message: string; filename?: string };
  getRuntimeAmbientData(): { playlists?: Record<string, unknown> } | null | undefined;
  ensureAmbientPlaylistMap(ambient: { playlists?: Record<string, unknown> }): Record<string, unknown>;
}): Promise<{ ok: boolean; message: string }> {
  if (!options.isLikelyJsonFile(options.file)) {
    return { ok: false, message: options.getLocalizedMessage('importUnsupportedFile', 'Only .json files are accepted.') };
  }

  if (options.ambientData?.isCloud) {
    const maxBytes = options.getCloudImportSizeLimitBytes(
      navigator.userAgent || '',
      options.cloudImportSizeLimitBytes
    );
    if (options.file.size > maxBytes) {
      return { ok: false, message: options.getLocalizedMessage('importCloudSizeError', 'File size exceeds the cloud import limit for this device.') };
    }
  }

  let parsed: unknown;
  try {
    const text = await options.file.text();
    parsed = options.parseImportedPlaylistJson(text);
  } catch (_error) {
    return { ok: false, message: options.getLocalizedMessage('importParseError', 'The selected file is not valid JSON.') };
  }

  if (!options.validatePlaylistSchemaContract(parsed)) {
    return { ok: false, message: options.getLocalizedMessage('importSchemaError', 'The selected file does not match the playlist schema.') };
  }

  const sanitized = options.sanitizeAndNormalizeImportPlaylist(
    parsed as Record<string, unknown>,
    options.ambientData?.isCloud === true
  );
  if (!sanitized) {
    return { ok: false, message: options.getLocalizedMessage('importSanitizeError', 'Unsafe or invalid media entries exceeded the allowed limit.') };
  }

  if (!options.validatePlaylistSchemaContract(sanitized.playlist)) {
    return { ok: false, message: options.getLocalizedMessage('importSchemaError', 'The selected file does not match the playlist schema.') };
  }

  if (options.ambientData?.isCloud) {
    if (!options.persistImportedCloudPlaylist(sanitized.playlist)) {
      return { ok: false, message: options.getLocalizedMessage('importPersistError', 'Failed to save imported playlist data.') };
    }
    options.ensureMyPlaylistOptionFromStorage();
    await options.activateImportedPlaylist(options.myPlaylistName);
    return { ok: true, message: options.getLocalizedMessage('importCloudReplacedMyPlaylist', 'Import completed. MyPlaylist has been replaced.') };
  }

  const response = await options.postImportedPlaylist(options.baseUrl, options.file.name, sanitized.playlist);
  const persistResult = options.resolveImportedPlaylistPersistResult(
    response,
    options.getLocalizedMessage('importPersistError', 'Failed to save imported playlist data.'),
    options.getLocalizedMessage('Playlist imported successfully.', 'Playlist imported successfully.')
  );
  if (!persistResult.ok) {
    return persistResult;
  }

  const importedPlaylistName = persistResult.filename as string;
  const ambient = options.getRuntimeAmbientData();
  if (ambient) {
    const playlists = options.ensureAmbientPlaylistMap(ambient);
    playlists[importedPlaylistName] = `./assets/${importedPlaylistName}`;
  }
  await options.activateImportedPlaylist(importedPlaylistName);

  return {
    ok: true,
    message: persistResult.message,
  };
}
