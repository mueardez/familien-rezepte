import { env } from "cloudflare:workers";
import { appOrigin, cookie, sameOriginMutation, SESSION_COOKIE } from "../../lib/auth-core";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (!sameOriginMutation(request, env)) return new Response("Nicht erlaubt", { status: 403 });
  return new Response(null, { status: 303, headers: {
    Location: `${appOrigin(env)}/anmelden`, "Set-Cookie": cookie(SESSION_COOKIE, "", 0), "Cache-Control": "no-store",
  } });
}
