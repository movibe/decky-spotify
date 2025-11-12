import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthState {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface SpotifyState {
  clientId: string;
  auth: AuthState;
  me?: any;
  deviceId?: string;
  query: string;
  results: any[];
  setClientId: (id: string) => void;
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  setMe: (me: any | undefined) => void;
  setDeviceId: (id: string | undefined) => void;
  setQuery: (q: string) => void;
  setResults: (items: any[]) => void;
}

/**
 * Creates a Zustand store to manage Spotify-related state with local persistence.
 * Persists only lightweight fields (clientId, auth, query) to localStorage.
 */
export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set) => ({
      clientId: "",
      auth: {},
      me: undefined,
      deviceId: undefined,
      query: "",
      results: [],
      setClientId: (id) => set({ clientId: id }),
      setAuth: (auth) => set({ auth }),
      clearAuth: () => set({ auth: {}, me: undefined }),
      setMe: (me) => set({ me }),
      setDeviceId: (id) => set({ deviceId: id }),
      setQuery: (q) => set({ query: q }),
      setResults: (items) => set({ results: items }),
    }),
    {
      name: "spotify_store",
      partialize: (state) => ({ clientId: state.clientId, auth: state.auth, query: state.query }),
    }
  )
);

