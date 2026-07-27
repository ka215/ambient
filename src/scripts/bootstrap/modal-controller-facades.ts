import {
  createOptionsModalController,
  createPlaylistDescModalController,
  type OptionsModalController,
  type OptionsModalControllerOptions,
  type PlaylistDescModalController,
  type PlaylistDescModalElements,
  type PlaylistDescModalSanitizers,
} from '../ui/modals';

export interface CreatePlaylistDescModalFacadeOptions {
  elements: PlaylistDescModalElements;
  sanitizers: PlaylistDescModalSanitizers;
}

export interface CreateOptionsModalFacadeOptions {
  options: OptionsModalControllerOptions;
}

export function createPlaylistDescModalFacade(
  options: CreatePlaylistDescModalFacadeOptions
): PlaylistDescModalController {
  return createPlaylistDescModalController(options.elements, options.sanitizers);
}

export function createOptionsModalFacade(
  options: CreateOptionsModalFacadeOptions
): OptionsModalController {
  return createOptionsModalController(options.options);
}
