export type MediaEditDurationSyncController = {
  clear: () => void;
  maybeComplete: () => boolean;
  startIfNeeded: () => void;
};

export function createMediaEditDurationSyncController(options: {
  timeoutMs: number;
  pollMs: number;
  onSetLoading: (isLoading: boolean) => void;
  getActiveItemKey: () => string | null;
  hasKnownDuration: () => boolean;
  onSyncReady: () => void;
}): MediaEditDurationSyncController {
  let timerId: number | null = null;
  let timeoutId: number | null = null;
  let itemKey: string | null = null;

  const clear = (): void => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    itemKey = null;
    options.onSetLoading(false);
  };

  const maybeComplete = (): boolean => {
    const activeItemKey = options.getActiveItemKey();
    if (!activeItemKey || !itemKey) {
      return false;
    }
    if (itemKey !== activeItemKey) {
      clear();
      return false;
    }
    if (!options.hasKnownDuration()) {
      return false;
    }
    clear();
    options.onSyncReady();
    return true;
  };

  const startIfNeeded = (): void => {
    const activeItemKey = options.getActiveItemKey();
    if (!activeItemKey) {
      clear();
      return;
    }
    if (options.hasKnownDuration()) {
      clear();
      return;
    }

    clear();
    itemKey = activeItemKey;
    options.onSetLoading(true);

    timerId = window.setInterval(() => {
      maybeComplete();
    }, options.pollMs);

    timeoutId = window.setTimeout(() => {
      clear();
      options.onSyncReady();
    }, options.timeoutMs);
  };

  return {
    clear,
    maybeComplete,
    startIfNeeded,
  };
}
