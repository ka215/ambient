import { initializeOptionsModalBindings } from './options-modal-init';

type InitializeOptionsModalBindingsOptions = Parameters<typeof initializeOptionsModalBindings>[0];

export interface InitializeOptionsModalRuntimeOptions extends Omit<
  InitializeOptionsModalBindingsOptions,
  'playlistDescManagementLink' | 'defaultMediaVolumeDisplay'
> {
  document: Document;
}

export function initializeOptionsModalRuntime(options: InitializeOptionsModalRuntimeOptions) {
  return initializeOptionsModalBindings({
    ...options,
    playlistDescManagementLink: options.document.getElementById('link-open-playlist-management-category') as HTMLAnchorElement | null,
    defaultMediaVolumeDisplay: options.document.getElementById('default-media-volume'),
  });
}
