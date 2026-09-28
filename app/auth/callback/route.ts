import { env } from "cloudflare:workers";
import { appOrigin, authConfigured, cookie, FLOW_COOKIE, readCookie, safeReturnPath, SESSION_COOKIE, SESSION_SECONDS, signCookieToken, verifyCookieToken, verifyGoogleToken } from "../../lib/auth-core";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = new Headers({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  headers.append("Set-Cookie", cookie(FLOW_COOKIE, "", 0));
  if (!authConfigured(env)) return new Response("Die Google-Anmeldung ist noch nicht eingerichtet.", { status: 503, headers });
  const params = new URL(request.url).searchParams;
  const flow = await verifyCookieToken(readCookie(request.headers.get("cookie"), FLOW_COOKIE), "login", env);
  if (!flow || !params.get("state") || params.get("state") !== flow.state ||
      typeof flow.nonce !== "string" || typeof flow.verifier !== "string" ||
      !params.get("code") || params.has("error")) {
    headers.set("Location", `${appOrigin(env)}/anmelden?error=login`);
    return new Response(null, { status: 303, headers });
  }
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!,
        code: params.get("code")!, code_verifier: flow.verifier, grant_type: "authorization_code",
        redirect_uri: `${appOrigin(env)}/auth/callback` }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Google exchange failed");
    const result = await response.json() as { id_token?: string };
    if (!result.id_token) throw new Error("Missing ID token");
    const user = await verifyGoogleToken(result.id_token, flow.nonce, env);
    // Google access tokens are not persisted; no Gmail access is requested.
    const session = await signCookieToken({ sub: user.id, email: user.email }, "session", env, SESSION_SECONDS);
    headers.append("Set-Cookie", cookie(SESSION_COOKIE, session, SESSION_SECONDS));
    headers.set("Location", new URL(safeReturnPath(typeof flow.returnTo === "string" ? flow.returnTo : "/"), appOrigin(env)).href);
    return new Response(null, { status: 303, headers });
  } catch {
    // Never log codes, Google tokens, credentials or full callback URLs.
    headers.set("Location", `${appOrigin(env)}/anmelden?error=login`);
    return new Response(null, { status: 303, headers });
  }
}
