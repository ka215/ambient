/**
 * Type definitions for YouTube IFrame API
 * Provides type safety for YouTube Player integration
 */

/**
 * YouTube Player constructor options
 */
export interface YTPlayerOptions {
  autoplay?: number;      // 0 = no autoplay, 1 = autoplay
  controls?: number;      // 0 = no controls, 1 = controls
  fs?: number;            // 0 = no fullscreen, 1 = allow fullscreen
  cc_load_policy?: number; // 0 = auto, 1 = always show captions
  cc_lang_pref?: string;  // ISO 639-1 caption language preference
  disablekb?: number;     // 0 = keyboard enabled, 1 = keyboard disabled
  playsinline?: number;   // 1 = inline playback on iOS
  rel?: number;           // 0 = no related videos, 1 = show related
  start?: number;         // Start time in seconds
  end?: number;           // End time in seconds
  [key: string]: any;     // Allow additional options
}

/**
 * YouTube Player event handlers object
 */
export interface YTPlayerEventHandlers {
  onReady?: (event: YTPlayerEvent) => void;
  onStateChange?: (event: YTPlayerEvent) => void;
  onError?: (event: YTPlayerEvent) => void;
  [key: string]: any;
}

/**
 * YouTube Player configuration for constructor
 */
export interface YTPlayerConfig {
  height: number;
  width: number;
  videoId: string;
  playerVars?: YTPlayerOptions;
  events?: YTPlayerEventHandlers;
}

/**
 * YouTube Player state constants (from YT.PlayerState)
 */
export const YTPlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

/**
 * YouTube Player error codes (from YT.PlayerError)
 */
export const YTPlayerError = {
  INVALID_PARAM: 2,
  HTML5_PLAYER_NOT_FOUND: 5,
  NOT_EMBEDDABLE: 101,
  NOT_EMBEDDABLE_SAME_AS_101: 150,
  NO_SUPPORTED_FORMAT: 13,
} as const;

/**
 * YouTube Player instance interface
 * This is a partial type definition covering the methods used by Ambient
 */
export interface YTPlayer {
  // Playback control
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  
  // Playback state
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoUrl(): string;
  getIframe(): HTMLIFrameElement;
  
  // Volume control
  setVolume(volume: number): void;
  getVolume(): number;
  
  // Destruction
  destroy(): void;
  
  // Additional properties
  g?: HTMLElement; // Internal reference to player DOM element
}

/**
 * YouTube IFrame API event object
 */
export interface YTPlayerEvent {
  target: YTPlayer;
  data?: number;
}

/**
 * Global YT namespace (added by YouTube IFrame API script)
 */
declare global {
  interface Window {
    YT?: {
      Player: new (element: string | HTMLElement, config: YTPlayerConfig) => YTPlayer;
      PlayerState: typeof YTPlayerState;
      PlayerError: typeof YTPlayerError;
      loaded: number;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};
