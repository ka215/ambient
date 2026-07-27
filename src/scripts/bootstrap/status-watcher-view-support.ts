export interface CreateStatusWatcherViewSupportOptions {
  status: AMP_STATUS;
}

export interface StatusWatcherViewSupport {
  getCurrentMediaId(): number | null;
  hasMediaItems(): boolean;
}

export function createStatusWatcherViewSupport(
  options: CreateStatusWatcherViewSupportOptions
): StatusWatcherViewSupport {
  return {
    getCurrentMediaId: () => options.status.current,
    hasMediaItems: () => options.status.media !== null && options.status.media.length > 0,
  };
}
