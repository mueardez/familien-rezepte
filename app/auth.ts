import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sessionUser, safeReturnPath } from "./lib/auth-core";

export async function getUser() {
  return sessionUser((await headers()).get("cookie"), env);
}

export async function requireUser(returnTo: string) {
  const user = await getUser();
  if (user) return user;
  redirect(`/anmelden?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`);
}
