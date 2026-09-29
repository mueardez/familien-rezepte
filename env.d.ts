// Wrangler generates the resource types locally. Runtime values are configured
// in the Cloudflare dashboard, not committed to this public repository.
declare namespace Cloudflare {
  interface Env {
    APP_ORIGIN?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    SESSION_SECRET?: string;
    RECIPE_ADMIN_EMAIL?: string;
    ALLOWED_EMAILS?: string;
    OPENAI_API_KEY?: string;
    POLL_VOTERS?: string;
    POLL_DISPATCH_SECRET?: string;
  }
}
