/**
 * Salida App Constants
 * 
 * These constants represent the defaults and configuration rules for the app.
 * By keeping them in a central file, they can easily be modified in the future.
 */

export const APP_CONFIG = {
  // Authentication & Guest Mode
  /** 
   * Number of videos a guest can view before being prompted to sign in. 
   * A video is counted if it is on screen for at least 2 seconds.
   */
  GUEST_VIDEO_VIEW_LIMIT: 10,
  /**
   * Continuous browsing time limit (in milliseconds) before prompting a guest.
   * Default: 5 minutes.
   */
  GUEST_BROWSE_TIME_LIMIT_MS: 5 * 60 * 1000,

  // Upload Limits (Align with Supabase free plan limits)
  /** Maximum video file size in bytes (50 MB) */
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024,
  /** Maximum video length in seconds (3 minutes) */
  MAX_VIDEO_DURATION_SEC: 180,
  /** Target resolution width for compressed videos (720p) */
  VIDEO_COMPRESS_TARGET_WIDTH: 720,
  
  /** Maximum audio file size in bytes (20 MB) */
  MAX_AUDIO_SIZE_BYTES: 20 * 1024 * 1024,
  
  /** Maximum image file size in bytes (10 MB) */
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  /** Maximum thumbnail file size in bytes (2 MB) */
  MAX_THUMBNAIL_SIZE_BYTES: 2 * 1024 * 1024,

  // Video Feed
  /** Number of videos to fetch per page in the vertical feed */
  VIDEO_FEED_PAGE_SIZE: 10,
};
