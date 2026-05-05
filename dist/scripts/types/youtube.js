/**
 * Type definitions for YouTube IFrame API
 * Provides type safety for YouTube Player integration
 */
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
};
/**
 * YouTube Player error codes (from YT.PlayerError)
 */
export const YTPlayerError = {
    INVALID_PARAM: 2,
    HTML5_PLAYER_NOT_FOUND: 5,
    NOT_EMBEDDABLE: 101,
    NOT_EMBEDDABLE_SAME_AS_101: 150,
    NO_SUPPORTED_FORMAT: 13,
};
//# sourceMappingURL=youtube.js.map