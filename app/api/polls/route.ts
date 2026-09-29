import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getUser } from "../../auth";
import { sameOriginMutation } from "../../lib/auth-core";
import { allRecipes } from "../../lib/shopping-list";
import { nextWeek, pollKey, readPoll, resolveVotes, syncWinners, voters } from "../../lib/polls";

export const dynamic = "force-dynamic";
const fail = (error: string, status: number) => NextResponse.json({ error }, { status });
export async function GET() {
  const user = await getUser();
  if (!user) return fail("Bitte anmelden.", 401);
  if (!voters().includes(user.email)) return fail("Dieses Konto nimmt nicht an der Abstimmung teil.", 403);
  if (!env.BUCKET || !env.DB) return fail("Speicher nicht verfügbar.", 503);
  const week = nextWeek();
  const { poll } = await readPoll(week);
  if (!poll) return fail("Die Abstimmung wird am Freitag eröffnet.", 404);
  if (poll.winners.length === 7) await syncWinners(poll);
  const catalogue = await allRecipes();
  return NextResponse.json({ week, choices: poll.choices.map((slug) => ({ slug, title: catalogue.find((item) => item.slug === slug)?.title ?? slug })), selected: poll.votes[user.email] ?? [], voted: Object.keys(poll.votes).length, complete: poll.winners.length === 7, winners: poll.winners.map((slug) => ({ slug, title: catalogue.find((item) => item.slug === slug)?.title ?? slug })) }, { headers: { "cache-control": "private, no-store" } });
}
export async function PUT(request: Request) {
  if (!sameOriginMutation(request, env)) return fail("Ungültige Anfrage.", 403);
  const user = await getUser();
  if (!user) return fail("Bitte anmelden.", 401);
  if (!voters().includes(user.email)) return fail("Dieses Konto nimmt nicht an der Abstimmung teil.", 403);
  if (!env.BUCKET || !env.DB) return fail("Speicher nicht verfügbar.", 503);
  let body: { selected?: unknown };
  try { body = await request.json(); } catch { return fail("Ungültige Auswahl.", 400); }
  const week = nextWeek();
  const { poll, version } = await readPoll(week);
  if (!poll) return fail("Die Abstimmung ist noch nicht eröffnet.", 404);
  if (poll.winners.length === 7) return fail("Die Abstimmung ist abgeschlossen.", 409);
  if (!Array.isArray(body.selected) || body.selected.length !== 7 || new Set(body.selected).size !== 7 || body.selected.some((slug) => typeof slug !== "string" || !poll.choices.includes(slug))) return fail("Bitte genau sieben der zehn Rezepte auswählen.", 400);
  const votes = { ...poll.votes, [user.email]: body.selected as string[] };
  const updated = { ...poll, votes, winners: Object.keys(votes).length === 2 ? resolveVotes({ ...poll, votes }) : [] };
  const saved = await env.BUCKET.put(pollKey(week), JSON.stringify(updated), { onlyIf: { etagMatches: version }, httpMetadata: { contentType: "application/json" } });
  if (!saved) return fail("Die Abstimmung wurde gleichzeitig geändert. Bitte neu laden.", 409);
  if (updated.winners.length === 7) await syncWinners(updated);
  return NextResponse.json({ complete: updated.winners.length === 7 });
}
