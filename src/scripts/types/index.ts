/**
 * Type definitions for Ambient Media Player v2
 * These types define the data structures and contracts used throughout the application
 * NOTE: No import/export here — this is a global ambient script, not an ES module.
 */

/**
 * Media item data structure
 */
interface MediaItem {
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
interface PlaylistOptions {
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
interface PlaylistData {
  options?: PlaylistOptions;
  media?: {
    [category: string]: MediaItem[];
  };
}

/**
 * Application status object - manages playback state
 */
interface AMP_STATUS {
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
  yt_phase?: string;
  yt_seq?: number;
  yt_error?: string;
}

/**
 * Global data passed from PHP to JavaScript
 */
interface AmbientData {
  debug?: boolean;
  imageDir?: string;
  currentPlaylist?: string;
  playlists?: {
    [key: string]: string;
  };
  isCloud?: boolean;
  [key: string]: any;
}

/**
 * Notification/alert payload
 */
interface NotificationPayload {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  delay?: number;
}

/**
 * Window size configuration
 */
interface WindowSize {
  width: number;
  height: number;
  minFullUIWidth: number;
}

/**
 * YouTube IFrame API types
 */
interface YTPlayerOptions {
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

interface YTPlayer {
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

interface YTOnReadyEvent {
  target: YTPlayer;
}

interface YTOnStateChangeEvent {
  data: number;
  target: YTPlayer;
}

interface YTOnErrorEvent {
  data: number;
  target: YTPlayer;
}

/**
 * Utility type for response wrapper
 */
interface ApiResponse<T = any> {
  state: 'ok' | 'error';
  code: number;
  data: T;
}

/**
 * Global variables passed from PHP / YouTube IFrame API
 */
declare var AmbientData: AmbientData;
declare var APP_KEY: string;
declare var YT: {
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
declare var player: YTPlayer | undefined;
