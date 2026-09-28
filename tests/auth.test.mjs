import assert from "node:assert/strict";
import test from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { appOrigin, authConfigured, cookie, emailAllowed, pkceChallenge, safeReturnPath, sameOriginMutation, SESSION_COOKIE, sessionUser, signCookieToken, verifyCookieToken, verifyGoogleToken } from "../app/lib/auth-core.ts";

const config = { APP_ORIGIN: "https://recipes.example.com", GOOGLE_CLIENT_ID: "test-client",
  GOOGLE_CLIENT_SECRET: "test-only", SESSION_SECRET: "test-only-not-for-production-0123456789", RECIPE_ADMIN_EMAIL: "admin@example.com", ALLOWED_EMAILS: "member@example.com" };

test("configuration fails closed and requires a fixed HTTPS origin", () => {
  assert.equal(authConfigured({}), false);
  assert.equal(authConfigured(config), true);
  assert.equal(authConfigured({ ...config, SESSION_SECRET: "short" }), false);
  for (const origin of ["http://example.com", "https://example.com/path", "https://user@example.com", "https://example.com/?q=1"]) {
    assert.throws(() => appOrigin({ APP_ORIGIN: origin }));
  }
});
test("allowlist matches full normalized emails, not substrings", () => {
  assert.equal(emailAllowed("ADMIN@example.com", config), true);
  assert.equal(emailAllowed("member@example.com", config), true);
  assert.equal(emailAllowed("bad-admin@example.com", config), false);
  assert.equal(emailAllowed("", {}), false);
});
test("return paths cannot redirect externally or loop through auth", () => {
  for (const path of ["//evil.com", "/\\evil.com", "https://evil.com", "/auth/google", "/anmelden", "/\r\nevil"]) assert.equal(safeReturnPath(path), "/");
  assert.equal(safeReturnPath("/rezept-import?test=1"), "/rezept-import?test=1");
});
test("mutations require exact Origin; missing or foreign Origin is rejected", () => {
  const request = (headers) => new Request("https://recipes.example.com/api/import/save", { method: "POST", headers });
  assert.equal(sameOriginMutation(request({ origin: config.APP_ORIGIN }), config), true);
  assert.equal(sameOriginMutation(request({}), config), false);
  assert.equal(sameOriginMutation(request({ origin: "https://evil.com" }), config), false);
  assert.equal(sameOriginMutation(request({ origin: config.APP_ORIGIN, "sec-fetch-site": "cross-site" }), config), false);
});
test("PKCE S256 matches the RFC 7636 test vector", async () => {
  assert.equal(await pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});
test("cookies have host-only, secure, HttpOnly and SameSite protections", () => {
  const value = cookie(SESSION_COOKIE, "test", 60);
  assert.match(value, /__Host-/); assert.match(value, /Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=60/);
  assert.doesNotMatch(value, /Domain=/);
});
test("sessions reject tampering, expiry, wrong purpose/key/origin and removed accounts", async () => {
  const token = await signCookieToken({ sub: "user123", email: "admin@example.com" }, "session", config, 60);
  const header = `${SESSION_COOKIE}=${token}`;
  assert.equal((await sessionUser(header, config)).id, "user123");
  assert.equal(await verifyCookieToken(token, "login", config), null);
  assert.equal(await verifyCookieToken(token.slice(0, -12) + "AAAAAAAAAAAA", "session", config), null);
  assert.equal(await verifyCookieToken(token, "session", { ...config, SESSION_SECRET: "different-test-secret-012345678901234" }), null);
  assert.equal(await verifyCookieToken(token, "session", { ...config, APP_ORIGIN: "https://other.example.com" }), null);
  assert.equal(await sessionUser(header, { ...config, RECIPE_ADMIN_EMAIL: "other@example.com" }), null);
  const expired = await signCookieToken({ sub: "x", email: "admin@example.com" }, "session", config, -1);
  assert.equal(await sessionUser(`${SESSION_COOKIE}=${expired}`, config), null);
  assert.equal(await sessionUser(null, config), null);
});
test("Google tokens validate signature, audience, issuer, expiry, nonce and verified allowlisted email", async () => {
  const pair = await generateKeyPair("RS256", { extractable: true });
  const jwk = await exportJWK(pair.publicKey);
  const keys = createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key", use: "sig", alg: "RS256" }] });
  const now = Math.floor(Date.now() / 1000);
  const base = { sub: "google-sub", email: "admin@example.com", email_verified: true, nonce: "nonce",
    aud: config.GOOGLE_CLIENT_ID, iss: "https://accounts.google.com", iat: now, exp: now + 300 };
  const sign = (changes = {}) => new SignJWT({ ...base, ...changes }).setProtectedHeader({ alg: "RS256", kid: "test-key" }).sign(pair.privateKey);
  assert.equal((await verifyGoogleToken(await sign(), "nonce", config, keys)).id, "google-sub");
  for (const changes of [{ aud: "other" }, { iss: "evil" }, { exp: now - 1 }, { nonce: "wrong" }, { email_verified: false }, { email: "stranger@example.com" }, { azp: "wrong" }]) {
    await assert.rejects(verifyGoogleToken(await sign(changes), "nonce", config, keys));
  }
  const forged = await new SignJWT(base).setProtectedHeader({ alg: "HS256" }).sign(new TextEncoder().encode(config.SESSION_SECRET));
  await assert.rejects(verifyGoogleToken(forged, "nonce", config, keys));
});
