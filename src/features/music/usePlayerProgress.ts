/**
 * usePlayerProgress.ts — Syncs TrackPlayer state → Zustand store
 *
 * react-native-track-player provides hooks (useProgress, usePlaybackState,
 * useActiveTrack) that read the native player's real-time state.
 *
 * This hook acts as a "bridge": it reads those values and writes them into
 * our Zustand playerStore so that all of our UI components can simply call
 * `usePlayerStore()` instead of importing multiple TrackPlayer hooks.
 *
 * Mount this hook once in the root layout so it runs for the lifetime of the app.
 */
import { useEffect } from 'react';
import { useProgress, usePlaybackState, useActiveTrack } from 'react-native-track-player';
import { usePlayerStore } from './playerStore';
import { State } from 'react-native-track-player';

export function usePlayerProgress() {
  const { position, duration } = useProgress(1000); // Update every 1 second
  const playbackState = usePlaybackState();
  const activeTrack = useActiveTrack();

  const setPosition = usePlayerStore((s) => s.setPosition);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const queue = usePlayerStore((s) => s.queue);

  // Sync position & duration into the store
  useEffect(() => {
    setPosition(position);
  }, [position, setPosition]);

  useEffect(() => {
    setDuration(duration);
  }, [duration, setDuration]);

  // Sync play/pause state into the store
  useEffect(() => {
    // playbackState.state can be undefined during initialization
    if (playbackState.state === State.Playing) {
      setIsPlaying(true);
    } else if (
      playbackState.state === State.Paused ||
      playbackState.state === State.Stopped ||
      playbackState.state === State.Ready
    ) {
      setIsPlaying(false);
    }
  }, [playbackState.state, setIsPlaying]);

  // When the active track changes in TrackPlayer (e.g., auto-advancement),
  // update the currentTrack in our store to match.
  useEffect(() => {
    if (activeTrack && queue.length > 0) {
      const match = queue.find((t) => t.id === activeTrack.id);
      if (match) {
        usePlayerStore.setState({ currentTrack: match });
      }
    }
  }, [activeTrack?.id, queue]);
}
