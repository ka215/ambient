import { createPlaylistUiBindings } from './playlist-ui-init';

type CreatePlaylistUiBindingsOptions = Parameters<typeof createPlaylistUiBindings>[0];

export interface InitializePlaylistUiRuntimeOptions extends Omit<
  CreatePlaylistUiBindingsOptions,
  'mediaCategoryInput' | 'mediaCategoryLabel' | 'mediaCategoryNote'
> {
  document: Document;
}

export function initializePlaylistUiRuntime(
  options: InitializePlaylistUiRuntimeOptions
): ReturnType<typeof createPlaylistUiBindings> {
  return createPlaylistUiBindings({
    ...options,
    mediaCategoryInput: options.document.getElementById('media-category-new') as HTMLInputElement | null,
    mediaCategoryLabel: options.document.getElementById('media-category-label') as HTMLLabelElement | null,
    mediaCategoryNote: options.document.getElementById('note-media-category-create-from-playlist-management') as HTMLElement | null,
  });
}
