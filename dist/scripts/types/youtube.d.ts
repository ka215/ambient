/**
 * Type definitions for YouTube IFrame API
 * Provides type safety for YouTube Player integration
 */
/**
 * YouTube Player constructor options
 */
export interface YTPlayerOptions {
    autoplay?: number;
    controls?: number;
    fs?: number;
    cc_load_policy?: number;
    rel?: number;
    start?: number;
    end?: number;
    [key: string]: any;
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
export declare const YTPlayerState: {
    readonly UNSTARTED: -1;
    readonly ENDED: 0;
    readonly PLAYING: 1;
    readonly PAUSED: 2;
    readonly BUFFERING: 3;
    readonly CUED: 5;
};
/**
 * YouTube Player error codes (from YT.PlayerError)
 */
export declare const YTPlayerError: {
    readonly INVALID_PARAM: 2;
    readonly HTML5_PLAYER_NOT_FOUND: 5;
    readonly NOT_EMBEDDABLE: 101;
    readonly NOT_EMBEDDABLE_SAME_AS_101: 150;
    readonly NO_SUPPORTED_FORMAT: 13;
};
/**
 * YouTube Player instance interface
 * This is a partial type definition covering the methods used by Ambient
 */
export interface YTPlayer {
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    getPlayerState(): number;
    getCurrentTime(): number;
    getDuration(): number;
    getVideoUrl(): string;
    getIframe(): HTMLIFrameElement;
    setVolume(volume: number): void;
    getVolume(): number;
    destroy(): void;
    g?: HTMLElement;
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
//# sourceMappingURL=youtube.d.ts.map