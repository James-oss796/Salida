/**
 * playerService.ts — react-native-track-player Service Setup
 *
 * This file handles the initialization and configuration of the audio player.
 * It uses react-native-track-player v4 to provide background audio playback.
 *
 * KEY CONCEPTS:
 * - `setupPlayer()` initializes the native audio player engine. It must be
 *   called once before any other TrackPlayer methods. It throws if called twice.
 * - `registerPlaybackService()` tells the native side which JS function to call
 *   for remote/lockscreen events (play, pause, next, etc.). It MUST be called
 *   at module level (top of file), not inside a React component.
 * - `Capability` controls which buttons appear on the lockscreen / notification.
 */
import TrackPlayer, {
  Capability,
  Event,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';

/** Whether setupPlayer() has already completed successfully */
let isSetup = false;

/**
 * Initialize the track player engine.
 * Safe to call multiple times — it will skip if already initialized.
 */
export async function setupTrackPlayer(): Promise<void> {
  if (isSetup) return;

  try {
    await TrackPlayer.setupPlayer({
      // Buffer size in seconds. Smaller = less memory, larger = smoother streaming
      minBuffer: 15,
      maxBuffer: 50,
      playBuffer: 2.5,
      backBuffer: 5,
    });

    // Configure which capabilities are available on the lockscreen / notification
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      // Show progress bar on notification
      progressUpdateEventInterval: 1,
    });

    isSetup = true;
    console.log('[TrackPlayer] Setup complete');
  } catch (error) {
    // setupPlayer throws "already initialized" if called twice.
    // We catch that silently and mark as setup.
    console.log('[TrackPlayer] Already initialized or error:', error);
    isSetup = true;
  }
}

/**
 * The Playback Service handler.
 * This function is called by the native side when remote events (lockscreen,
 * notification, headphone buttons) happen. We simply forward them to TrackPlayer.
 *
 * This is registered at module level below — it MUST NOT be inside a component.
 */
async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    TrackPlayer.skipToNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    TrackPlayer.skipToPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    TrackPlayer.reset();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });
}

// Register the playback service at module level.
// This line runs once when the JS bundle is loaded.
TrackPlayer.registerPlaybackService(() => playbackService);
