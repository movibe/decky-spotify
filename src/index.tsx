import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Navigation,
  staticClasses
} from "@decky/ui";
import {
  addEventListener,
  removeEventListener,
  definePlugin,
  toaster,
  routerHook,
} from "@decky/api"
import React, { useEffect, useMemo } from "react";
import { FaSpotify } from "react-icons/fa";
import { buildAuthorizeUrl } from "./spotify-core";
import { useSpotifyStore } from "./store";

// import logo from "../assets/logo.png";

// removed unused sample callables from template

// PKCE helpers moved to ./spotify-core

/**
 * Exchange authorization code for tokens using PKCE.
 */
async function exchangeCodeForToken(args: { clientId: string; code: string; redirectUri: string; verifier: string }): Promise<{ access_token: string; refresh_token?: string; expires_in: number }>{
  const body = new URLSearchParams({
    client_id: args.clientId,
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.redirectUri,
    code_verifier: args.verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

/**
 * Refresh the access token when expired.
 */
async function refreshAccessToken(args: { clientId: string; refreshToken: string }): Promise<{ access_token: string; expires_in: number }>{
  const body = new URLSearchParams({
    client_id: args.clientId,
    grant_type: "refresh_token",
    refresh_token: args.refreshToken,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}


/**
 * Ensure a valid access token, refreshing if needed.
 */
async function ensureAccessToken(clientId: string, getAuth: () => { accessToken?: string; refreshToken?: string; expiresAt?: number }, setAuth: (a: { accessToken: string; refreshToken?: string; expiresAt: number }) => void): Promise<string | undefined>{
  const { accessToken, refreshToken, expiresAt } = getAuth();
  const now = Date.now();
  if (accessToken && expiresAt && now < expiresAt - 60_000) return accessToken;
  if (refreshToken) {
    const refreshed = await refreshAccessToken({ clientId, refreshToken });
    const newAuth = { accessToken: refreshed.access_token, refreshToken, expiresAt: Date.now() + refreshed.expires_in * 1000 };
    setAuth(newAuth);
    return newAuth.accessToken;
  }
  return undefined;
}

/**
 * Fetch current Spotify user profile.
 */
async function fetchMe(token: string): Promise<any>{
  const res = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`me failed: ${res.status}`);
  return res.json();
}

/**
 * Load Spotify Web Playback SDK script.
 */
async function loadSpotifySdk(): Promise<void>{
  if ((window as any).Spotify) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    (window as any).onSpotifyWebPlaybackSDKReady = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Spotify SDK"));
    document.head.appendChild(s);
  });
}

/**
 * Create and connect a Spotify Player instance.
 */
async function createAndConnectPlayer(token: string): Promise<{ player: any; deviceId: string }>{
  const player = new (window as any).Spotify.Player({
    name: "Decky Spotify Player",
    getOAuthToken: (cb: (t: string) => void) => cb(token),
    volume: 0.5,
  });
  await player.connect();
  const deviceId: string = await new Promise((resolve) => {
    player.addListener("ready", ({ device_id }: any) => resolve(device_id));
  });
  return { player, deviceId };
}

/**
 * Transfer playback to the web player device.
 */
async function transferPlayback(token: string, deviceId: string): Promise<void>{
  await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ device_ids: [deviceId], play: true }),
  });
}

/**
 * Play a track URI on the current device.
 */
async function playUris(token: string, uris: string[]): Promise<void>{
  await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ uris }),
  });
}

/**
 * Search tracks by query.
 */
async function searchTracks(token: string, q: string): Promise<any[]>{
  const params = new URLSearchParams({ q, type: "track", limit: "10" });
  const res = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  const data = await res.json();
  return data.tracks?.items ?? [];
}

/**
 * Logout and clear stored auth.
 */
function logout(clearAuth: () => void){
  clearAuth();
}

/**
 * OAuth callback view to finalize PKCE flow.
 */
function SpotifyAuthCallback({ clientId, redirectUri }: { clientId: string; redirectUri: string }){
  const setAuth = useSpotifyStore((s) => s.setAuth);
  const [error, setError] = React.useState<string | undefined>();
  useEffect(() => {
    (async () => {
      try {
        const u = new URL(window.location.href);
        const code = u.searchParams.get("code");
        const state = u.searchParams.get("state");
        const storedState = sessionStorage.getItem("spotify_state") || undefined;
        const verifier = sessionStorage.getItem("spotify_verifier") || "";
        if (!code || !verifier || !clientId || (storedState && storedState !== state)) throw new Error("Invalid callback params");
        const tokens = await exchangeCodeForToken({ clientId, code, redirectUri, verifier });
        setAuth({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: Date.now() + tokens.expires_in * 1000 });
        Navigation.Navigate("/");
        Navigation.CloseSideMenus();
        toaster.toast({ title: "Spotify conectado", body: "Login concluído" });
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, [clientId, redirectUri]);
  return (
    <PanelSection title="Spotify Login">
      <PanelSectionRow>
        {error ? `Erro: ${error}` : "Processando login..."}
      </PanelSectionRow>
    </PanelSection>
  );
}

function Content(){
  const clientId = useSpotifyStore((s) => s.clientId);
  const setClientId = useSpotifyStore((s) => s.setClientId);
  const auth = useSpotifyStore((s) => s.auth);
  const setAuth = useSpotifyStore((s) => s.setAuth);
  const me = useSpotifyStore((s) => s.me);
  const setMe = useSpotifyStore((s) => s.setMe);
  const setDeviceId = useSpotifyStore((s) => s.setDeviceId);
  const query = useSpotifyStore((s) => s.query);
  const setQuery = useSpotifyStore((s) => s.setQuery);
  const results = useSpotifyStore((s) => s.results);
  const setResults = useSpotifyStore((s) => s.setResults);
  const clearAuth = useSpotifyStore((s) => s.clearAuth);
  const token = auth.accessToken;
  const redirectUri = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/decky-spotify-callback`;
  }, []);

  useEffect(() => {
    (async () => {
      if (!clientId) return;
      const t = await ensureAccessToken(clientId, () => useSpotifyStore.getState().auth, (a) => setAuth(a));
      if (!t) return;
      try {
        const profile = await fetchMe(t);
        setMe(profile);
      } catch {}
    })();
  }, [clientId]);

  const doLogin = async () => {
    if (!clientId) {
      toaster.toast({ title: "Client ID obrigatório", body: "Insira seu Spotify Client ID" });
      return;
    }
    const scopes = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "playlist-read-private",
    ];
    const { url, verifier, state } = await buildAuthorizeUrl(clientId, redirectUri, scopes);
    sessionStorage.setItem("spotify_verifier", verifier);
    sessionStorage.setItem("spotify_state", state);
    routerHook.addRoute("/decky-spotify-callback", () => <SpotifyAuthCallback clientId={clientId} redirectUri={redirectUri} />, { exact: true });
    Navigation.Navigate(url);
  };

  const initPlayer = async () => {
    if (!token) return;
    await loadSpotifySdk();
    const { deviceId: id } = await createAndConnectPlayer(token);
    setDeviceId(id);
    await transferPlayback(token, id);
    toaster.toast({ title: "Player pronto", body: `Device ${id}` });
  };

  const onSearch = async () => {
    if (!token || !query) return;
    const items = await searchTracks(token, query);
    setResults(items);
  };

  const onPlay = async (uri: string) => {
    if (!token) return;
    await playUris(token, [uri]);
  };

  const onLogout = () => {
    logout(clearAuth);
    setMe(undefined);
    setDeviceId(undefined);
  };

  return (
    <PanelSection title="Spotify Player">
      <PanelSectionRow>
        <input
          placeholder="Client ID"
          value={clientId}
          onChange={(e) => setClientId((e.target as HTMLInputElement).value)}
          style={{ width: "100%" }}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        {`Redirect URI: ${redirectUri}`}
      </PanelSectionRow>
      <PanelSectionRow>
        <ButtonItem layout="below" onClick={doLogin}>Conectar ao Spotify</ButtonItem>
      </PanelSectionRow>
      {token && (
        <>
          <PanelSectionRow>
            {me ? `Logado como: ${me.display_name || me.id}` : "Obtendo perfil..."}
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={initPlayer}>Iniciar Web Player</ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
              <input
                placeholder="Buscar música"
                value={query}
                onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                style={{ flex: 1 }}
              />
              <ButtonItem layout="below" onClick={onSearch}>Buscar</ButtonItem>
            </div>
          </PanelSectionRow>
          {results.map((t) => (
            <PanelSectionRow key={t.id}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <div>
                  {t.name} — {t.artists?.map((a: any) => a.name).join(", ")}
                </div>
                <ButtonItem layout="inline" onClick={() => onPlay(t.uri)}>Play</ButtonItem>
              </div>
            </PanelSectionRow>
          ))}
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={onLogout}>Logout</ButtonItem>
          </PanelSectionRow>
        </>
      )}
    </PanelSection>
  );
};

export default definePlugin(() => {
  const listener = addEventListener<[
    test1: string,
    test2: boolean,
    test3: number
  ]>("timer_event", (test1, test2, test3) => {
    toaster.toast({
      title: "timer_event",
      body: `${test1}, ${test2}, ${test3}`
    });
  });

  routerHook.addRoute("/decky-spotify-callback", () => <SpotifyAuthCallback clientId={localStorage.getItem("spotify_client_id") || ""} redirectUri={`${window.location.origin}/decky-spotify-callback`} />, { exact: true });

  return {
    name: "Decky Spotify",
    titleView: <div className={staticClasses.Title}>Spotify Web Player</div>,
    content: <Content />,
    icon: <FaSpotify />,
    onDismount() {
      removeEventListener("timer_event", listener);
      routerHook.removeRoute("/decky-spotify-callback");
    },
  };
});
