export type PlayerViewKind = 'youtube' | 'video' | 'audio';

export interface PlayerViewSource {
  videoId?: string;
  filePath?: string;
  sourceType?: string;
  controls?: boolean;
  fullscreen?: boolean;
  ccLoadPolicy?: number;
  rel?: number;
  startSec?: number;
  endSec?: number;
}

export interface PlayerViewUiEvents {
  onReady?: () => void;
  onPlaying?: () => void;
  onPaused?: () => void;
  onEnded?: () => void;
  onError?: (code: string, detail?: string) => void;
  onTimeUpdate?: (seconds: number) => void;
  onDuration?: (seconds: number) => void;
  onVolumeChange?: (volume: number) => void;
}

export interface PlayerViewAdapter {
  readonly kind: PlayerViewKind;
  mount(container: HTMLElement): Promise<void>;
  unmount(): void;
  setSource(source: PlayerViewSource): Promise<void>;
  setVolume(volume: number): void;
  setPlayingState(state: 'play' | 'pause' | 'stop'): void;
  bindUiEvents(events: PlayerViewUiEvents): void;
}
