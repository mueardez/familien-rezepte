import { env } from "cloudflare:workers";
import { readCatalog, methodFor } from "./catalog";
import type { Recipe } from "../data/recipes";
import { allRecipes, currentWeek, listKey, readWeek, validWeek } from "./shopping-list";

export type Poll = { week: string; choices: string[]; votes: Record<string, string[]>; winners: string[]; applied?: boolean };
export const pollKey = (week: string) => `polls/${week}.json`;
export const nextWeek = () => { const date = new Date(`${currentWeek()}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 7); return date.toISOString().slice(0, 10); };
export function voters(): string[] {
  const input = env.POLL_VOTERS || env.ALLOWED_EMAILS || "";
  const emails = [...new Set(input.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean))];
  return emails.length === 2 && emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? emails : [];
}
function score(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}
export function chooseRecipes(catalogue: Recipe[], week: string, previous: string[] = []): string[] {
  const slugs = [...new Set(catalogue.map((recipe) => recipe.slug))];
  const prior = new Set(previous);
  // Use different recipes first; if fewer than 20 exist, fill from the previous week's set.
  return slugs.sort((a, b) => Number(prior.has(a)) - Number(prior.has(b)) || score(`${week}:${a}`) - score(`${week}:${b}`) || a.localeCompare(b)).slice(0, 10);
}
export function resolveVotes(poll: Poll): string[] {
  const [first, second] = Object.values(poll.votes);
  if (!first || !second || first.length !== 7 || second.length !== 7) return [];
  const shared = first.filter((slug) => second.includes(slug));
  const extras = [...new Set([...first, ...second])].filter((slug) => !shared.includes(slug))
    .sort((a, b) => score(`${poll.week}:tie:${a}`) - score(`${poll.week}:tie:${b}`) || a.localeCompare(b));
  return [...shared, ...extras].slice(0, 7);
}
export async function readPoll(week: string): Promise<{ poll: Poll | null; version: string }> {
  const object = await env.BUCKET.get(pollKey(week));
  return object ? { poll: JSON.parse(await object.text()) as Poll, version: object.etag } : { poll: null, version: "" };
}
export async function ensurePoll(week: string): Promise<Poll> {
  if (!validWeek(week)) throw new Error("Invalid week");
  const existing = await readPoll(week);
  if (existing.poll) return existing.poll;
  const { data: settings } = await readCatalog();
  const catalogue = (await allRecipes()).filter((recipe) => methodFor(settings, recipe.method)?.inPoll === true);
  if (catalogue.length < 10) throw new Error("Mindestens zehn für Umfragen freigegebene Rezepte sind erforderlich.");
  const date = new Date(`${week}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - 7);
  const lastWeek = date.toISOString().slice(0, 10);
  const previous = (await readPoll(lastWeek)).poll?.choices ?? [];
  const poll: Poll = { week, choices: chooseRecipes(catalogue, week, previous), votes: {}, winners: [] };
  const saved = await env.BUCKET.put(pollKey(week), JSON.stringify(poll), { onlyIf: new Headers({ "If-None-Match": "*" }), httpMetadata: { contentType: "application/json" } });
  return saved ? poll : (await readPoll(week)).poll!;
}
export async function syncWinners(poll: Poll): Promise<void> {
  if (poll.winners.length !== 7 || poll.applied) return;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { list, version } = await readWeek(poll.week);
    const recipes = [...new Set([...list.recipes, ...poll.winners])];
    if (recipes.length === list.recipes.length) break;
    const saved = await env.BUCKET.put(listKey(poll.week), JSON.stringify({ ...list, recipes }), {
      onlyIf: version ? { etagMatches: version } : new Headers({ "If-None-Match": "*" }), httpMetadata: { contentType: "application/json" },
    });
    if (saved) break;
  }
  const { list } = await readWeek(poll.week);
  if (!poll.winners.every((slug) => list.recipes.includes(slug))) throw new Error("Wochenliste wurde gleichzeitig geändert. Bitte erneut laden.");
  const latest = await readPoll(poll.week);
  if (latest.poll && !latest.poll.applied) await env.BUCKET.put(pollKey(poll.week), JSON.stringify({ ...latest.poll, applied: true }), { onlyIf: { etagMatches: latest.version }, httpMetadata: { contentType: "application/json" } });
}
