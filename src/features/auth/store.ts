import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../config/constants';

type RequireAuthReason = 'upload' | 'like' | 'playlist' | 'report' | 'edit' | 'browse-limit' | null;

interface AuthState {
  // Session tracking (Supabase session is primarily tracked in AuthProvider, but we keep an explicit logged-in boolean here for UI convenience)
  isLoggedIn: boolean;
  setLoggedIn: (isLoggedIn: boolean) => void;

  // Guest Gate tracking
  videosViewedSinceLastPrompt: number;
  sessionStartedAt: number;
  incrementVideoView: () => void;
  resetGuestGate: () => void;

  // Sign in sheet state
  pendingActionReason: RequireAuthReason;
  pendingActionCallback: (() => void) | null;
  isSignInSheetVisible: boolean;
  
  // Actions
  requireAuth: (reason: RequireAuthReason, callback?: () => void) => void;
  closeSignInSheet: () => void;
  executePendingAction: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),

      videosViewedSinceLastPrompt: 0,
      sessionStartedAt: Date.now(),
      
      incrementVideoView: () => {
        const { videosViewedSinceLastPrompt, sessionStartedAt, isLoggedIn, requireAuth, resetGuestGate } = get();
        if (isLoggedIn) return; // Members don't get prompted
        
        const newCount = videosViewedSinceLastPrompt + 1;
        set({ videosViewedSinceLastPrompt: newCount });

        const timeSinceStartMs = Date.now() - sessionStartedAt;
        
        if (newCount >= APP_CONFIG.GUEST_VIDEO_VIEW_LIMIT || timeSinceStartMs >= APP_CONFIG.GUEST_BROWSE_TIME_LIMIT_MS) {
          requireAuth('browse-limit');
          resetGuestGate();
        }
      },
      
      resetGuestGate: () => set({
        videosViewedSinceLastPrompt: 0,
        sessionStartedAt: Date.now()
      }),

      pendingActionReason: null,
      pendingActionCallback: null,
      isSignInSheetVisible: false,

      requireAuth: (reason, callback) => {
        const { isLoggedIn } = get();
        if (isLoggedIn) {
          if (callback) callback();
        } else {
          set({
            isSignInSheetVisible: true,
            pendingActionReason: reason,
            pendingActionCallback: callback || null,
          });
        }
      },

      closeSignInSheet: () => set({
        isSignInSheetVisible: false,
        pendingActionReason: null,
        pendingActionCallback: null,
      }),

      executePendingAction: () => {
        const { pendingActionCallback } = get();
        set({
          isSignInSheetVisible: false,
          pendingActionReason: null,
          pendingActionCallback: null,
        });
        if (pendingActionCallback) {
          pendingActionCallback();
        }
      }
    }),
    {
      name: 'salida-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // We only want to persist the gate counters, not the ephemeral sheet state
      partialize: (state) => ({
        videosViewedSinceLastPrompt: state.videosViewedSinceLastPrompt,
        sessionStartedAt: state.sessionStartedAt,
      }),
    }
  )
);
