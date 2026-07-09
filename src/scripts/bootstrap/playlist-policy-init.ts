import { applyCloudEditRestrictionsView } from '../ui/forms/cloud-edit-restrictions';

export interface InitializePlaylistPolicyOptions {
  getAmbientData(): { isCloud?: boolean } | null | undefined;
  getRuntimeAmbientData(): { isCloud?: boolean } | null | undefined;
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
    const ambientData = options.getAmbientData();
    if (ambientData?.isCloud === true) {
      return options.getCurrentPlaylist() === options.myPlaylistName || !options.getCurrentPlaylist();
    }
    return true;
  };

  const applyCloudEditRestrictions = (): void => {
    const ambientData = options.getRuntimeAmbientData();
    if (!ambientData?.isCloud) return;
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
