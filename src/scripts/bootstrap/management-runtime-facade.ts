type InitializeManagementRuntimeOptions =
  Parameters<typeof import('./management-runtime-init').initializeManagementRuntime>[0];

type ManagementImportHelperOptions = InitializeManagementRuntimeOptions['importHelperOptions'];
type ManagementBindingOptions = InitializeManagementRuntimeOptions['bindingOptions'];
type PlaylistActionOptions = InitializeManagementRuntimeOptions['playlistActionOptions'];
type MediaBindings = NonNullable<InitializeManagementRuntimeOptions['initOptions']['mediaBindings']>;
type PlaylistBindings = NonNullable<InitializeManagementRuntimeOptions['initOptions']['playlistBindings']>;

export interface CreateManagementRuntimeFacadeOptions {
  document: Document;
  importHelperOptions: ManagementImportHelperOptions;
  bindingOptions: ManagementBindingOptions;
  playlistActionOptions: PlaylistActionOptions;
  mediaBindings: MediaBindings;
  playlistBindings: PlaylistBindings;
}

export function createManagementRuntimeFacade(
  options: CreateManagementRuntimeFacadeOptions
): InitializeManagementRuntimeOptions {
  return {
    document: options.document,
    importHelperOptions: options.importHelperOptions,
    bindingOptions: options.bindingOptions,
    playlistActionOptions: options.playlistActionOptions,
    initOptions: {
      mediaBindings: options.mediaBindings,
      playlistBindings: options.playlistBindings,
    },
  };
}
