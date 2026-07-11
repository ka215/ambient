import { initializeManagementBindingComposition } from './management-bindings-init';
import { createManagementImportHelpers } from './management-import-init';
import { createPlaylistManagementActions } from './management-init';

type ManagementBindingOptions = NonNullable<
  Parameters<typeof initializeManagementBindingComposition>[0]['bindingOptions']
>;
type ManagementInitOptions = NonNullable<
  Parameters<typeof initializeManagementBindingComposition>[0]['initOptions']
>;
type MediaManagementInitBindings = NonNullable<ManagementInitOptions['mediaBindings']>;
type PlaylistManagementInitBindings = NonNullable<ManagementInitOptions['playlistBindings']>;
type ManagementImportHelperOptions = Parameters<typeof createManagementImportHelpers>[0];
type PlaylistManagementActionOptions = Parameters<typeof createPlaylistManagementActions>[0];

export interface InitializeManagementRuntimeOptions {
  document: Document;
  importHelperOptions: ManagementImportHelperOptions;
  bindingOptions: Omit<
    ManagementBindingOptions,
    'mediaForm' | 'mediaElements' | 'playlistForm' | 'playlistElements'
  >;
  playlistActionOptions: Omit<
    PlaylistManagementActionOptions,
    'form' | 'generatePlaylistJson' | 'importPlaylistFromFile'
  > & {
    generatePlaylistJson: PlaylistManagementActionOptions['generatePlaylistJson'];
  };
  initOptions: {
    mediaBindings: Omit<
      MediaManagementInitBindings,
      'form' | 'elements' | 'resetMediaManagementForm' | 'addMediaData' | 'getRelativeFilepath'
    > | null;
    playlistBindings: Omit<
      PlaylistManagementInitBindings,
      'form' | 'elements' | 'resetPlaylistManagementForm' | 'createCategory' | 'downloadPlaylist' | 'importPlaylist'
    > | null;
  };
}

export function initializeManagementRuntime(options: InitializeManagementRuntimeOptions): void {
  const mediaForm = options.document.querySelector('form[name="mediaManagement"]') as HTMLFormElement | null;
  const mediaElements: HTMLElement[] = mediaForm ? (Array.from(mediaForm.elements) as HTMLElement[]) : [];
  const playlistForm = options.document.querySelector('form[name="playlistManagement"]') as HTMLFormElement | null;
  const playlistElements: HTMLElement[] = playlistForm ? (Array.from(playlistForm.elements) as HTMLElement[]) : [];

  const { getRelativeFilepath, importPlaylistFromFile } = createManagementImportHelpers(
    options.importHelperOptions
  );

  const bindings = initializeManagementBindingComposition({
    bindingOptions: {
      ...options.bindingOptions,
      mediaForm,
      mediaElements,
      playlistForm,
      playlistElements,
    },
  });

  if (!bindings) {
    return;
  }

  const actions = createPlaylistManagementActions({
    ...options.playlistActionOptions,
    form: playlistForm,
    generatePlaylistJson: bindings.generatePlaylistJson,
    importPlaylistFromFile,
  });

  initializeManagementBindingComposition({
    initOptions: {
      mediaBindings: mediaForm && options.initOptions.mediaBindings
        ? {
            ...options.initOptions.mediaBindings,
            form: mediaForm,
            elements: mediaElements,
            resetMediaManagementForm: bindings.resetMediaManageForm,
            addMediaData: bindings.addMediaData,
            getRelativeFilepath,
          }
        : null,
      playlistBindings: playlistForm && options.initOptions.playlistBindings
        ? {
            ...options.initOptions.playlistBindings,
            form: playlistForm,
            elements: playlistElements,
            resetPlaylistManagementForm: bindings.resetPlaylistManageForm,
            createCategory: actions.createCategory,
            downloadPlaylist: actions.downloadPlaylist,
            importPlaylist: actions.importPlaylist,
          }
        : null,
    },
  });
}
