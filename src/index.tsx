import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  Navigation,
  staticClasses,
  DropdownItem
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
import { useTranslation } from "react-i18next";
import { buildAuthorizeUrl } from "./spotify-core";
import { useSpotifyStore } from "./store";
import "./i18n";

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
  const { t } = useTranslation();
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
        toaster.toast({ title: t("spotify.connected"), body: t("spotify.loginComplete") });
      } catch (e: any) {
        setError(e?.message || String(e));
      }
    })();
  }, [clientId, redirectUri]);
  return (
    <PanelSection title={t("auth.title")}>
      <PanelSectionRow>
        {error ? `${t("common.error")}: ${error}` : t("auth.processingLogin")}
      </PanelSectionRow>
    </PanelSection>
  );
}

function Content(){
  const { t, i18n } = useTranslation();
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
  const language = useSpotifyStore((s) => s.language);
  const setLanguage = useSpotifyStore((s) => s.setLanguage);
  const token = auth.accessToken;
  const redirectUri = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/decky-spotify-callback`;
  }, []);

  // Sync language with i18next
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

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
      toaster.toast({ title: t("spotify.clientIdRequired"), body: t("spotify.clientIdRequiredBody") });
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
    toaster.toast({ title: t("spotify.playerReady"), body: `${t("spotify.device")} ${id}` });
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

  const handleLanguageChange = (lang: 'en' | 'pt' | 'fr') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <>
      <PanelSection title={t("spotify.title")}>
        <PanelSectionRow>
          <input
            placeholder={t("common.clientId")}
            value={clientId}
            onChange={(e) => setClientId((e.target as HTMLInputElement).value)}
            style={{ width: "100%" }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          {`${t("common.redirectUri")}: ${redirectUri}`}
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={doLogin}>{t("common.connect")}</ButtonItem>
        </PanelSectionRow>
        {token && (
          <>
            <PanelSectionRow>
              {me ? `${t("spotify.loggedInAs")}: ${me.display_name || me.id}` : t("spotify.gettingProfile")}
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={initPlayer}>{t("spotify.initWebPlayer")}</ButtonItem>
            </PanelSectionRow>
            <PanelSectionRow>
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <input
                  placeholder={t("common.searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
                  style={{ flex: 1 }}
                />
                <ButtonItem layout="below" onClick={onSearch}>{t("common.search")}</ButtonItem>
              </div>
            </PanelSectionRow>
            {results.map((track) => (
              <PanelSectionRow key={track.id}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <div>
                    {track.name} — {track.artists?.map((a: any) => a.name).join(", ")}
                  </div>
                  <ButtonItem layout="inline" onClick={() => onPlay(track.uri)}>{t("common.play")}</ButtonItem>
                </div>
              </PanelSectionRow>
            ))}
            <PanelSectionRow>
              <ButtonItem layout="below" onClick={onLogout}>{t("common.logout")}</ButtonItem>
            </PanelSectionRow>
          </>
        )}
      </PanelSection>
      <PanelSection title={t("language.title")}>
        <PanelSectionRow>
          <DropdownItem
            label={t("language.title")}
            menuLabel={t("language.title")}
            rgOptions={[
              { data: 'en', label: t("language.english") },
              { data: 'pt', label: t("language.portuguese") },
              { data: 'fr', label: t("language.french") },
            ]}
            selectedOption={language}
            onChange={(option) => {
              if (option && option.data) {
                handleLanguageChange(option.data as 'en' | 'pt' | 'fr');
              }
            }}
          />
        </PanelSectionRow>
      </PanelSection>
    </>
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
