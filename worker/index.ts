import handler from "vinext/server/app-router-entry";

// Dish photos use unoptimized <Image>; no paid Images binding is required.
export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext): Promise<Response> {
    const response = await handler.fetch(request, env, ctx);
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    const path = new URL(request.url).pathname;
    if (path.startsWith("/auth/") || path === "/anmelden" || path === "/rezept-import" || path.endsWith("/bearbeiten") || path.startsWith("/api/import/") || path.startsWith("/api/recipes/") || path.startsWith("/einkaufsliste") || path.startsWith("/api/shopping-list") || path.startsWith("/api/polls") || path === "/abstimmung" || path.startsWith("/api/catalog") || path === "/admin") {
      headers.set("Cache-Control", "private, no-store");
      headers.set("Referrer-Policy", "no-referrer");
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
