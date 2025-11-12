/**
 * Create a random string to use as PKCE code verifier.
 * @returns {string} A 64-char URL-safe code verifier
 */
export function createCodeVerifier(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  for (let i = 0; i < 64; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Convert a verifier into a base64url-encoded SHA256 challenge.
 * @param {string} verifier The PKCE code verifier
 * @returns {Promise<string>} base64url(SHA256(verifier)) without padding
 */
export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(digest))));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Build the Spotify authorization URL with PKCE.
 * @param {string} clientId Spotify application Client ID
 * @param {string} redirectUri Redirect URI registered in Spotify Dashboard
 * @param {string[]} scopes Array of scopes to request
 * @returns {Promise<{ url: string; verifier: string; state: string }>} Authorization URL and PKCE data
 */
export async function buildAuthorizeUrl(clientId: string, redirectUri: string, scopes: string[]): Promise<{ url: string; verifier: string; state: string }>{
  const verifier = createCodeVerifier();
  const challenge = await createCodeChallenge(verifier);
  const state = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: scopes.join(" "),
    state,
    show_dialog: "true",
  });
  return { url: `https://accounts.spotify.com/authorize?${params.toString()}`, verifier, state };
}

