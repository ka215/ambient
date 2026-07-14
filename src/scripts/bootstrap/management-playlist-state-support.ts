import type { MediaItem } from '../types/ambient';

export interface CreateManagementPlaylistStateSupportOptions {
  status: AMP_STATUS;
}

export interface ManagementPlaylistStateSupport {
  getCurrentMediaId(): number | null;
  getFirstMediaId(): number | null;
}

export function createManagementPlaylistStateSupport(
  options: CreateManagementPlaylistStateSupportOptions
): ManagementPlaylistStateSupport {
  return {
    getCurrentMediaId: () => options.status.current,
    getFirstMediaId: () => ((options.status.media || [])[0] as MediaItem | undefined)?.amId ?? null,
  };
}
