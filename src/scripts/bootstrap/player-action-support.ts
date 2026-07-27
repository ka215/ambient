export interface PlayerActionSupport {
  setUpdatePlayStatus(callback: (amId: number) => void): void;
  setPlayItem(callback: (target: HTMLElement | null, playId?: number | null) => void): void;
  updatePlayStatus(amId: number): void;
  playItem(target: HTMLElement | null, playId?: number | null): void;
}

export function createPlayerActionSupport(): PlayerActionSupport {
  let updatePlayStatusHandler: ((amId: number) => void) | null = null;
  let playItemHandler: ((target: HTMLElement | null, playId?: number | null) => void) | null = null;

  return {
    setUpdatePlayStatus(callback) {
      updatePlayStatusHandler = callback;
    },
    setPlayItem(callback) {
      playItemHandler = callback;
    },
    updatePlayStatus(amId) {
      updatePlayStatusHandler?.(amId);
    },
    playItem(target, playId) {
      playItemHandler?.(target, playId);
    },
  };
}
