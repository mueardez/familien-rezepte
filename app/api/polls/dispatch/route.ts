import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { appOrigin } from "../../../lib/auth-core";
import { ensurePoll, nextWeek, voters } from "../../../lib/polls";

import { readCatalog } from "../../../lib/catalog";
import { defaultMailSchedule, duePollWeek } from "../../../lib/mail-schedule";

import { pollEmail } from "../../../lib/poll-email";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const secret = env.POLL_DISPATCH_SECRET;
  if (!secret || secret.length < 32 || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Nicht erlaubt." }, { status: 401 });
  const recipients = voters();
  if (recipients.length !== 2 || !env.BUCKET || !env.DB) return NextResponse.json({ error: "Abstimmung ist nicht eingerichtet." }, { status: 503 });
  let scheduled = true;
  if (request.headers.get("content-type")?.includes("application/json")) {
    try { const body = await request.json() as { scheduled?: unknown }; if (typeof body.scheduled !== "boolean") throw new Error(); scheduled = body.scheduled; }
    catch { return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 }); }
  }
  const schedule = (await readCatalog()).data.mailSchedule ?? defaultMailSchedule;
  const week = scheduled ? duePollWeek(schedule) : nextWeek();
  if (!week) return NextResponse.json({ due: false, recipients: [] }, { headers: { "cache-control": "private, no-store" } });
  const poll = await ensurePoll(week);
  const url = new URL("/abstimmung", appOrigin(env)); url.searchParams.set("week", poll.week);
  return NextResponse.json({ due: true, week: poll.week, recipients, url: url.href, htmlBody: pollEmail(poll.week, url.href) }, { headers: { "cache-control": "private, no-store" } });
}
