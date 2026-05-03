/**
 * Type definitions for Ambient Media Player v2
 * These types define the data structures and contracts used throughout the application
 */

/**
 * Media item data structure
 */
export interface MediaItem {
  amId: number;
  catId: number;
  title: string;
  artist?: string;
  desc?: string;
  image?: string;
  thumb?: string;
  file?: string;
  videoid?: string;
  volume?: number;
  start?: number | string;
  end?: number | string;
  controls?: boolean | string;
  fs?: boolean | string;
  cc?: boolean | string;
  fadeout?: number | string;
  fadein?: number | string;
}

/**
 * Playlist options configuration
 */
export interface PlaylistOptions {
  background?: string;
  random?: boolean;
  shuffle?: boolean;
  seek?: boolean;
  fader?: boolean;
  volume?: number;
  dark?: boolean;
  autoplay?: boolean;
  controls?: boolean | number;
  fs?: boolean | number;
  cc_load_policy?: boolean | number;
  rel?: boolean | number;
  caption?: string;
  playlist?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Playlist data structure (response from API)
 */
export interface PlaylistData {
  options?: PlaylistOptions;
  media?: {
    [category: string]: MediaItem[];
  };
}

/**
 * Application status object - manages playback state
 */
export interface AMP_STATUS {
  prev: number | null;
  current: number | null;
  next: number | null;
  ctg: number;
  category: string[] | null;
  playlist: string | null;
  media: MediaItem[] | null;
  order: 'normal' | 'random';
  playertype: 'youtube' | 'audio' | 'video' | null;
  volume: number | null;
  options: PlaylistOptions | null;
  addtype?: string | null;
  notice?: NotificationPayload | null;
  loop?: boolean | null;
  shuffle?: MediaItem[] | null;
  fader?: boolean;
}

/**
 * Global data passed from PHP to JavaScript
 */
export interface AmbientData {
  debug?: boolean;
  imageDir?: string;
  currentPlaylist?: string;
  playlists?: {
    [key: string]: string;
  };
  [key: string]: any;
}

/**
 * Notification/alert payload
 */
export interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  delay?: number;
}

/**
 * Window size configuration
 */
export interface WindowSize {
  width: number;
  height: number;
  minFullUIWidth: number;
}

/**
 * YouTube IFrame API types
 */
export interface YTPlayerOptions {
  height: number;
  width: number;
  videoId: string;
  playerVars: {
    autoplay?: number;
    controls?: number;
    fs?: number;
    cc_load_policy?: number;
    rel?: number;
    start?: string;
    end?: string;
  };
  events: {
    onReady: (event: YTOnReadyEvent) => void;
    onStateChange: (event: YTOnStateChangeEvent) => void;
    onError: (event: YTOnErrorEvent) => void;
  };
}

export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getVideoUrl: () => string;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  destroy: () => void;
  getIframe: () => HTMLIFrameElement;
}

export interface YTOnReadyEvent {
  target: YTPlayer;
}

export interface YTOnStateChangeEvent {
  data: number;
  target: YTPlayer;
}

export interface YTOnErrorEvent {
  data: number;
  target: YTPlayer;
}

/**
 * Utility type for response wrapper
 */
export interface ApiResponse<T = any> {
  state: 'ok' | 'error';
  code: number;
  data: T;
}

/**
 * Declaretion for global AmbientData passed from PHP
 */
declare global {
  var AmbientData: AmbientData;
  var APP_KEY: string;
  var YT: {
    Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
    PlayerState: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  };
  var player: YTPlayer | undefined;
}

export {};
