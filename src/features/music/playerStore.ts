/**
 * playerStore.ts — Global Music Player State
 *
 * A Zustand store that manages the currently playing track, queue, playback
 * state, and user preferences (repeat, shuffle). All UI components read from
 * this store, and the store drives react-native-track-player under the hood.
 *
 * ARCHITECTURE:
 * - UI components call store actions (playTrack, togglePlayPause, etc.)
 * - Store actions call TrackPlayer methods (play, pause, reset, add, etc.)
 * - usePlayerProgress hook reads from TrackPlayer and writes position/duration
 *   back into this store so components don't need to subscribe to TrackPlayer directly.
 */
import { create } from 'zustand';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';
import { TrackWithAuthor } from './api';
import { getPublicUrl } from '../../lib/storage';

/** Repeat modes cycle: off → all → one → off */
type AppRepeatMode = 'off' | 'one' | 'all';

interface PlayerState {
  /** The track currently being played (or paused) */
  currentTrack: TrackWithAuthor | null;
  /** The full playback queue */
  queue: TrackWithAuthor[];
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  position: number;
  /** Total duration of the current track in seconds */
  duration: number;
  /** Repeat mode: off, repeat-all, or repeat-one */
  repeatMode: AppRepeatMode;
  /** Whether shuffle is enabled */
  isShuffled: boolean;

  // ─── Actions ────────────────────────────────────────────────────────

  /** Start playing a specific track. Optionally pass a full queue. */
  playTrack: (track: TrackWithAuthor, fullQueue?: TrackWithAuthor[]) => Promise<void>;
  /** Add a track to the end of the current queue */
  addToQueue: (track: TrackWithAuthor) => Promise<void>;
  /** Skip to the next track */
  playNext: () => Promise<void>;
  /** Skip to the previous track */
  playPrevious: () => Promise<void>;
  /** Toggle between play and pause */
  togglePlayPause: () => Promise<void>;
  /** Seek to a specific position in seconds */
  seekTo: (seconds: number) => Promise<void>;
  /** Cycle the repeat mode: off → all → one → off */
  toggleRepeat: () => Promise<void>;
  /** Toggle shuffle on/off */
  toggleShuffle: () => void;
  /** Stop playback and clear the current track */
  stop: () => Promise<void>;

  // ─── Internal setters (called by usePlayerProgress hook) ────────────

  setPosition: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  position: 0,
  duration: 0,
  repeatMode: 'off',
  isShuffled: false,

  playTrack: async (track, fullQueue) => {
    try {
      // Build the public URL for the audio file from Supabase Storage
      const audioUrl = getPublicUrl('music', track.audio_path);
      if (!audioUrl) {
        console.error('[PlayerStore] No audio URL for track:', track.id);
        return;
      }

      // Build artwork URL (cover image)
      const artworkUrl = getPublicUrl('thumbnails', track.cover_path) || undefined;

      // Reset the player queue and add the new track
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: track.id,
        url: audioUrl,
        title: track.title,
        artist: track.artist,
        artwork: artworkUrl,
      });

      // If a full queue was provided (e.g., from a songs list), add remaining tracks
      const queueTracks = fullQueue || [track];
      if (fullQueue && fullQueue.length > 1) {
        const remaining = fullQueue.filter((t) => t.id !== track.id);
        for (const t of remaining) {
          const url = getPublicUrl('music', t.audio_path);
          const art = getPublicUrl('thumbnails', t.cover_path) || undefined;
          if (url) {
            await TrackPlayer.add({
              id: t.id,
              url,
              title: t.title,
              artist: t.artist,
              artwork: art,
            });
          }
        }
      }

      await TrackPlayer.play();

      set({
        currentTrack: track,
        queue: queueTracks,
        isPlaying: true,
        position: 0,
      });
    } catch (error) {
      console.error('[PlayerStore] playTrack error:', error);
    }
  },

  addToQueue: async (track) => {
    try {
      const audioUrl = getPublicUrl('music', track.audio_path);
      if (!audioUrl) return;

      const artworkUrl = getPublicUrl('thumbnails', track.cover_path) || undefined;

      await TrackPlayer.add({
        id: track.id,
        url: audioUrl,
        title: track.title,
        artist: track.artist,
        artwork: artworkUrl,
      });

      set((state) => ({ queue: [...state.queue, track] }));
    } catch (error) {
      console.error('[PlayerStore] addToQueue error:', error);
    }
  },

  playNext: async () => {
    try {
      await TrackPlayer.skipToNext();
      // The track change event (handled by usePlayerProgress) will update currentTrack
    } catch (error) {
      console.log('[PlayerStore] No next track');
    }
  },

  playPrevious: async () => {
    try {
      const { position } = get();
      // If we're more than 3 seconds in, restart the current track instead of going back
      if (position > 3) {
        await TrackPlayer.seekTo(0);
      } else {
        await TrackPlayer.skipToPrevious();
      }
    } catch (error) {
      console.log('[PlayerStore] No previous track');
    }
  },

  togglePlayPause: async () => {
    const { isPlaying } = get();
    if (isPlaying) {
      await TrackPlayer.pause();
      set({ isPlaying: false });
    } else {
      await TrackPlayer.play();
      set({ isPlaying: true });
    }
  },

  seekTo: async (seconds) => {
    await TrackPlayer.seekTo(seconds);
    set({ position: seconds });
  },

  toggleRepeat: async () => {
    const { repeatMode } = get();
    let nextMode: AppRepeatMode;
    let nativeMode: RepeatMode;

    switch (repeatMode) {
      case 'off':
        nextMode = 'all';
        nativeMode = RepeatMode.Queue;
        break;
      case 'all':
        nextMode = 'one';
        nativeMode = RepeatMode.Track;
        break;
      case 'one':
      default:
        nextMode = 'off';
        nativeMode = RepeatMode.Off;
        break;
    }

    await TrackPlayer.setRepeatMode(nativeMode);
    set({ repeatMode: nextMode });
  },

  toggleShuffle: () => {
    set((state) => ({ isShuffled: !state.isShuffled }));
    // Note: True shuffle requires reordering the TrackPlayer queue.
    // For MVP, we just toggle the flag. A full implementation would
    // call TrackPlayer.removeUpcomingTracks() and re-add in shuffled order.
  },

  stop: async () => {
    await TrackPlayer.reset();
    set({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      position: 0,
      duration: 0,
    });
  },

  setPosition: (seconds) => set({ position: seconds }),
  setDuration: (seconds) => set({ duration: seconds }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}));
