import type { YTPlayer } from '../types/youtube';

export interface CreatePlayerRuntimeHelpersOptions {
  isSeekActive(): boolean;
  startSeek(callback: () => void, intervalMs: number): void;
  startFader(type: 'fadein' | 'fadeout', callback: () => void, intervalMs: number): void;
  resolvePlayingState(): number;
  setPlayer(player: YTPlayer): void;
}

export interface PlayerRuntimeHelpers {
  isSeekActive(): boolean;
  startSeek(callback: () => void, intervalMs: number): void;
  startFader(type: 'fadein' | 'fadeout', callback: () => void, intervalMs: number): void;
  resolvePlayingState(): number;
  setPlayer(player: YTPlayer): void;
}

export function createPlayerRuntimeHelpers(
  options: CreatePlayerRuntimeHelpersOptions
): PlayerRuntimeHelpers {
  return {
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    startFader: options.startFader,
    resolvePlayingState: options.resolvePlayingState,
    setPlayer: options.setPlayer,
  };
}
