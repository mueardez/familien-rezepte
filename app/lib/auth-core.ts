import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey, type JWTPayload } from "jose";

export type AuthConfig = {
  APP_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SESSION_SECRET?: string;
  ALLOWED_EMAILS?: string;
  RECIPE_ADMIN_EMAIL?: string;
};
export type AppUser = { id: string; email: string; displayName: string };
export const SESSION_COOKIE = "__Host-familien-session";
export const FLOW_COOKIE = "__Host-familien-login";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const FLOW_SECONDS = 600;
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function appOrigin(config: AuthConfig): string {
  const url = new URL(config.APP_ORIGIN || "https://not-configured.invalid");
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("APP_ORIGIN must be an HTTPS origin without a path");
  }
  return url.origin;
}

export function authConfigured(config: AuthConfig): boolean {
  try {
    return Boolean(config.APP_ORIGIN && appOrigin(config) && config.GOOGLE_CLIENT_ID &&
      config.GOOGLE_CLIENT_SECRET && config.SESSION_SECRET && config.SESSION_SECRET.length >= 32 &&
      config.RECIPE_ADMIN_EMAIL);
  } catch { return false; }
}

export function emailAllowed(email: string, config: AuthConfig): boolean {
  return [config.RECIPE_ADMIN_EMAIL || "", ...(config.ALLOWED_EMAILS || "").split(",")]
    .map((value) => value.trim().toLowerCase()).filter(Boolean).includes(email.trim().toLowerCase());
}

export function safeReturnPath(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/";
  try {
    const url = new URL(value, "https://app.invalid");
    if (url.origin !== "https://app.invalid" || url.pathname.startsWith("/auth") || url.pathname === "/anmelden") return "/";
    return url.pathname + url.search + url.hash;
  } catch { return "/"; }
}

export function sameOriginMutation(request: Request, config: AuthConfig): boolean {
  return Boolean(config.APP_ORIGIN) && request.headers.get("origin") === appOrigin(config) &&
    request.headers.get("sec-fetch-site") !== "cross-site";
}

export function readCookie(header: string | null, name: string): string | undefined {
  return header?.split(";").map((item) => item.trim()).find((item) => item.startsWith(name + "="))?.slice(name.length + 1);
}

export function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function randomToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))).toString("base64url");
}

function signingKey(config: AuthConfig) {
  if (!config.SESSION_SECRET || config.SESSION_SECRET.length < 32) throw new Error("Session key missing");
  return new TextEncoder().encode(config.SESSION_SECRET);
}

export async function signCookieToken(payload: JWTPayload, purpose: "login" | "session", config: AuthConfig, seconds: number) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(appOrigin(config)).setAudience(purpose).setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + seconds).sign(signingKey(config));
}

export async function verifyCookieToken(token: string | undefined, purpose: "login" | "session", config: AuthConfig): Promise<JWTPayload | null> {
  if (!token || token.length > 4096) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(config), {
      algorithms: ["HS256"], issuer: appOrigin(config), audience: purpose,
      requiredClaims: ["iat", "exp"], maxTokenAge: purpose === "login" ? FLOW_SECONDS : SESSION_SECONDS,
    });
    return payload;
  } catch { return null; }
}

export async function sessionUser(cookieHeader: string | null, config: AuthConfig): Promise<AppUser | null> {
  if (!authConfigured(config)) return null;
  const payload = await verifyCookieToken(readCookie(cookieHeader, SESSION_COOKIE), "session", config);
  if (!payload || typeof payload.sub !== "string" || typeof payload.email !== "string" || !emailAllowed(payload.email, config)) return null;
  return { id: payload.sub, email: payload.email, displayName: payload.email };
}

export async function verifyGoogleToken(token: string, nonce: string, config: AuthConfig, keys: JWTVerifyGetKey = googleKeys): Promise<AppUser> {
  const { payload } = await jwtVerify(token, keys, {
    algorithms: ["RS256"], issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: config.GOOGLE_CLIENT_ID, requiredClaims: ["sub", "iat", "exp", "aud", "iss"], maxTokenAge: 600,
  });
  if (!config.GOOGLE_CLIENT_ID || payload.nonce !== nonce || payload.email_verified !== true ||
      typeof payload.email !== "string" || !payload.sub ||
      (payload.azp !== undefined && payload.azp !== config.GOOGLE_CLIENT_ID) ||
      !emailAllowed(payload.email, config)) throw new Error("Account not allowed");
  return { id: payload.sub, email: payload.email.trim().toLowerCase(), displayName: payload.email };
}
