export interface CreatePlaylistResumeSupportOptions {
  status: AMP_STATUS;
  getPlaylistUiFacade(): {
    syncTargetCategorySelection(): void;
  };
  updatePlayStatus(amId: number): void;
}

export interface PlaylistResumeSupport {
  onCategoryResumeApplied(nextCategoryId: number): void;
  onMediaResumeApplied(resumeAmId: number): void;
}

export function createPlaylistResumeSupport(
  options: CreatePlaylistResumeSupportOptions
): PlaylistResumeSupport {
  return {
    onCategoryResumeApplied: (nextCategoryId) => {
      options.status.ctg = nextCategoryId;
      options.getPlaylistUiFacade().syncTargetCategorySelection();
    },
    onMediaResumeApplied: (resumeAmId) => {
      options.updatePlayStatus(resumeAmId);
    },
  };
}
