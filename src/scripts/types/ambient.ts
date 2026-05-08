/**
 * Type definitions for Ambient Media Player
 * Defines data contracts and interfaces used throughout the application.
 */

/**
 * Individual media item in a playlist
 */
export interface MediaItem {
  amId: number;           // Unique index within the playlist
  catId: number;          // Category index (0-based)
  title: string;
  artist?: string;
  desc?: string;
  file?: string;          // Local media file path
  videoid?: string;       // YouTube video ID
  image?: string;         // Cover image path
  thumb?: string;         // Thumbnail image path
  volume?: number;        // 0-100, default 50
  start?: string | number; // Seek start time (seconds or HH:MM:SS)
  end?: string | number;   // Seek end time
  fadein?: string | number; // Fade-in duration
  fadeout?: string | number; // Fade-out duration
  controls?: boolean | string; // Show/hide player controls
  fs?: boolean | string;    // Allow fullscreen
  cc?: boolean | string;    // Closed captions policy
}

/**
 * Playlist-level configuration options
 */
export interface PlaylistOptions {
  background?: string;     // Background image filename
  random?: boolean;        // Random playback
  shuffle?: boolean;       // Shuffle playback
  seek?: boolean;          // Enable seek/start-end controls
  fullwindow?: boolean;    // Expand player area to fit window
  fader?: boolean;         // Enable fade-in/fade-out
  volume?: number;         // Default volume (0-100)
  dark?: boolean;          // Dark mode
  autoplay?: boolean | number; // Auto-play on load
  controls?: boolean | number; // Show player controls
  fs?: boolean | number;    // Allow fullscreen
  cc_load_policy?: number;  // YouTube CC policy (0,1)
  rel?: number;            // YouTube related videos (0,1)
  playlist?: string;       // Playlist display format string
  caption?: string;        // Media caption format string
}

/**
 * Complete playlist data structure (from JSON)
 */
export interface PlaylistData {
  options?: PlaylistOptions;
  media: {
    [category: string]: MediaItem[];
  };
}

/**
 * Player state object that tracks current playback status
 * Properties with watchers (via Object.defineProperty) are watched for changes
 */
export interface AmpStatus {
  // Navigation state
  prev: number | null;          // Previous media amId (watched)
  current: number | null;       // Current media amId (watched)
  next: number | null;          // Next media amId (watched)

  // Category/Playlist state
  ctg: number;                  // Current category index, -1 = all (watched)
  category: string[] | null;    // Category names from playlist
  playlist: string | null;      // Current playlist name
  media: MediaItem[] | null;    // All loaded media items

  // Playback order/mode
  order: 'normal' | 'random';   // Playback order (watched)
  shuffle: MediaItem[] | [];    // Shuffled media list (not in initStatus, dynamically added)

  // Player info
  playertype: 'youtube' | 'audio' | 'video' | null; // Current player type
  volume: number | null;        // Current volume (0-100) (watched)
  fader?: boolean;              // Pseudo fade-in/out enabled (dynamically added)

  // Options and settings
  options: PlaylistOptions | null; // Playlist-level options (watched)

  // Flags and notifications
  addtype?: string | null;      // Media type being added ('youtube' or 'file')
  notice?: NotificationObject | null; // Current notification (watched)
  loop?: boolean | null;        // Loop playback (watched)
}

/**
 * Notification/Alert object for UI feedback
 */
export interface NotificationObject {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  delay?: number;  // Auto-dismiss delay in ms
}

/**
 * Global AmbientData object passed from PHP to JavaScript
 * Contains initialization data and configuration
 */
export interface AmbientDataGlobal {
  debug?: boolean;           // Enable debug logging
  currentPlaylist?: string;  // Single playlist to load
  playlists?: {
    [name: string]: string;  // Playlist name => filename mapping
  };
  imageDir?: string;         // Base directory for images (relative URL)
  mediaDir?: string;         // Base directory for local media files (relative URL)
  [key: string]: any;        // Allow additional properties
}

/**
 * Window resize container tracking current viewport dimensions
 */
export interface WindowSize {
  width: number;
  height: number;
  minFullUIWidth: number;  // Minimum width for full UI layout (1282px)
}

/**
 * YouTube Player event type (from YT.Player)
 */
export interface YTPlayerEvent {
  target: any; // YT.Player instance
  data?: number;  // YT.PlayerState value
}

/**
 * HTML Media Player element (audio or video)
 */
export type MediaElement = HTMLAudioElement | HTMLVideoElement;

/**
 * Seek interval container
 */
export type SeekIntervalId = ReturnType<typeof setInterval> | null;

/**
 * Fade effect interval container
 */
export interface FaderIntervalIds {
  fadein: ReturnType<typeof setInterval> | null;
  fadeout: ReturnType<typeof setInterval> | null;
}
