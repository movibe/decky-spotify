import { describe, it, expect } from "bun:test";
import { createCodeVerifier, createCodeChallenge, buildAuthorizeUrl } from "../src/spotify-core";

describe("spotify-core PKCE", () => {
  it("createCodeVerifier returns 64 URL-safe chars", () => {
    const v = createCodeVerifier();
    expect(v.length).toBe(64);
    expect(/^[A-Za-z0-9._~-]+$/.test(v)).toBe(true);
  });

  it("createCodeChallenge returns base64url without padding", async () => {
    const v = "abc".repeat(22).slice(0, 64); // deterministic 64-chars
    const c = await createCodeChallenge(v);
    expect(typeof c).toBe("string");
    expect(/^[A-Za-z0-9-_]+$/.test(c)).toBe(true);
    expect(c.includes("=")).toBe(false);
  });

  it("buildAuthorizeUrl includes required params", async () => {
    const clientId = "test-client";
    const redirectUri = "https://example.com/callback";
    const scopes = ["streaming", "user-read-email"];
    const { url, verifier, state } = await buildAuthorizeUrl(clientId, redirectUri, scopes);
    expect(typeof url).toBe("string");
    expect(url.startsWith("https://accounts.spotify.com/authorize?")).toBe(true);
    const qp = new URL(url).searchParams;
    expect(qp.get("client_id")).toBe(clientId);
    expect(qp.get("response_type")).toBe("code");
    expect(qp.get("redirect_uri")).toBe(redirectUri);
    expect(qp.get("code_challenge_method")).toBe("S256");
    expect(qp.get("scope")).toBe(scopes.join(" "));
    expect(typeof verifier).toBe("string");
    expect(verifier.length).toBe(64);
    expect(typeof state).toBe("string");
    expect(state.length).toBeGreaterThan(0);
  });
});

