import { env } from "cloudflare:workers";
import { appOrigin, authConfigured, cookie, FLOW_COOKIE, FLOW_SECONDS, pkceChallenge, randomToken, safeReturnPath, signCookieToken } from "../../lib/auth-core";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!authConfigured(env)) return new Response("Die Google-Anmeldung ist noch nicht eingerichtet.", { status: 503, headers: { "Cache-Control": "no-store" } });
  const state = randomToken(), nonce = randomToken(), verifier = randomToken();
  const returnTo = safeReturnPath(new URL(request.url).searchParams.get("return_to"));
  const flow = await signCookieToken({ state, nonce, verifier, returnTo }, "login", env, FLOW_SECONDS);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!, redirect_uri: `${appOrigin(env)}/auth/callback`,
    response_type: "code", scope: "openid email", state, nonce,
    code_challenge: await pkceChallenge(verifier), code_challenge_method: "S256", prompt: "select_account",
  }).toString();
  return new Response(null, { status: 302, headers: {
    Location: url.href, "Set-Cookie": cookie(FLOW_COOKIE, flow, FLOW_SECONDS),
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
  } });
}
