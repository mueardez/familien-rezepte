import { sql } from "drizzle-orm";
import { integer, text, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";

export const importedRecipes = sqliteTable("imported_recipes", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  ownerEmail: text("owner_email").notNull(),
  title: text("title").notNull(),
  language: text("language").notNull().default("de"),
  time: text("time").notNull().default("30 Min."),
  method: text("method").notNull().default("Andere"),
  instagramRecipe: integer("instagram_recipe", { mode: "boolean" }).notNull().default(true),
  servings: text("servings").notNull().default("3 Portionen"),
  ingredientsJson: text("ingredients_json").notNull(),
  stepsJson: text("steps_json").notNull(),
  imageKey: text("image_key").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_imported_recipes_slug").on(table.slug)]);
