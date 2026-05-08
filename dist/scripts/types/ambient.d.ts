/**
 * Type definitions for Ambient Media Player
 * Defines data contracts and interfaces used throughout the application.
 */
/**
 * Individual media item in a playlist
 */
export interface MediaItem {
    amId: number;
    catId: number;
    title: string;
    artist?: string;
    desc?: string;
    file?: string;
    videoid?: string;
    image?: string;
    thumb?: string;
    volume?: number;
    start?: string | number;
    end?: string | number;
    fadein?: string | number;
    fadeout?: string | number;
    controls?: boolean | string;
    fs?: boolean | string;
    cc?: boolean | string;
}
/**
 * Playlist-level configuration options
 */
export interface PlaylistOptions {
    background?: string;
    random?: boolean;
    shuffle?: boolean;
    seek?: boolean;
    fullwindow?: boolean;
    fader?: boolean;
    volume?: number;
    dark?: boolean;
    autoplay?: boolean | number;
    controls?: boolean | number;
    fs?: boolean | number;
    cc_load_policy?: number;
    rel?: number;
    playlist?: string;
    caption?: string;
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
    prev: number | null;
    current: number | null;
    next: number | null;
    ctg: number;
    category: string[] | null;
    playlist: string | null;
    media: MediaItem[] | null;
    order: 'normal' | 'random';
    shuffle: MediaItem[] | [];
    playertype: 'youtube' | 'audio' | 'video' | null;
    volume: number | null;
    fader?: boolean;
    options: PlaylistOptions | null;
    addtype?: string | null;
    notice?: NotificationObject | null;
    loop?: boolean | null;
}
/**
 * Notification/Alert object for UI feedback
 */
export interface NotificationObject {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    delay?: number;
}
/**
 * Global AmbientData object passed from PHP to JavaScript
 * Contains initialization data and configuration
 */
export interface AmbientDataGlobal {
    debug?: boolean;
    currentPlaylist?: string;
    playlists?: {
        [name: string]: string;
    };
    imageDir?: string;
    mediaDir?: string;
    [key: string]: any;
}
/**
 * Window resize container tracking current viewport dimensions
 */
export interface WindowSize {
    width: number;
    height: number;
    minFullUIWidth: number;
}
/**
 * YouTube Player event type (from YT.Player)
 */
export interface YTPlayerEvent {
    target: any;
    data?: number;
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
//# sourceMappingURL=ambient.d.ts.map