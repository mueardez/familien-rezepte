import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const id = config.d1_databases?.find((db) => db.binding === "DB")?.database_id;
if (!id || id === "00000000-0000-4000-8000-000000000000" || !/^[0-9a-f-]{36}$/i.test(id)) {
  console.error("STOP: First create familien-rezepte-db in your own Cloudflare account and put its database ID in wrangler.jsonc. Nothing was deployed.");
  process.exit(1);
}
if (config.r2_buckets?.[0]?.bucket_name !== "familien-rezepte-bilder") {
  console.error("STOP: Check the R2 bucket configuration before deploying.");
  process.exit(1);
}
