import { applyCloudEditRestrictionsView } from '../ui/forms/cloud-edit-restrictions';

export interface InitializePlaylistPolicyOptions {
  getAmbientData(): { isCloud?: boolean; playlists?: Record<string, unknown> } | null | undefined;
  getRuntimeAmbientData(): { isCloud?: boolean; playlists?: Record<string, unknown> } | null | undefined;
  getCurrentPlaylist(): string | null;
  myPlaylistName: string;
  mediaForm: HTMLFormElement | null;
  playlistForm: HTMLFormElement | null;
  readonlyTitle: string;
}

export function initializePlaylistPolicy(options: InitializePlaylistPolicyOptions): {
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
} {
  const canMutateCurrentPlaylist = (): boolean => {
    const ambientData = options.getRuntimeAmbientData() || options.getAmbientData();
    const currentPlaylist = options.getCurrentPlaylist();
    if (ambientData?.isCloud === true) {
      return currentPlaylist === options.myPlaylistName || !currentPlaylist;
    }
    if (!currentPlaylist) {
      return false;
    }
    const playlists = ambientData?.playlists;
    return !!playlists && Object.prototype.hasOwnProperty.call(playlists, currentPlaylist);
  };

  const applyCloudEditRestrictions = (): void => {
    applyCloudEditRestrictionsView({
      canMutatePlaylist: canMutateCurrentPlaylist(),
      mediaForm: options.mediaForm,
      playlistForm: options.playlistForm,
      readonlyTitle: options.readonlyTitle,
    });
  };

  return {
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
  };
}
