import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { appOrigin } from "../../../lib/auth-core";
import { ensurePoll, nextWeek, voters } from "../../../lib/polls";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const secret = env.POLL_DISPATCH_SECRET;
  if (!secret || secret.length < 32 || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  const recipients = voters();
  if (recipients.length !== 2 || !env.BUCKET || !env.DB) return NextResponse.json({ error: "Abstimmung ist nicht eingerichtet." }, { status: 503 });
  const poll = await ensurePoll(nextWeek());
  return NextResponse.json({ week: poll.week, recipients, url: new URL("/abstimmung", appOrigin(env)).href }, { headers: { "cache-control": "private, no-store" } });
}
