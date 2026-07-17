import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const GENRES = [
  "Fiction",
  "Mystery",
  "Thriller",
  "Horror",
  "Sci-Fi",
  "Fantasy",
  "Graphic Novel",
  "Romance",
  "Romantasy",
  "Memoir",
  "Self-Help",
  "Business",
  "Biography",
  "Hobby",
  "Craft",
  "Other",
] as const;

export const STATUSES = ["wishlist", "reading", "finished", "dnf"] as const;

export const RATING_SYSTEMS = ["cawpile", "hearted", "craft"] as const;

// Genre -> allowed rating system(s), mirrors the original ratings calculator's genre gate
export const GENRE_RATING_MAP: Record<string, (typeof RATING_SYSTEMS)[number]> = {
  Fiction: "cawpile",
  Mystery: "cawpile",
  Thriller: "cawpile",
  Horror: "cawpile",
  "Sci-Fi": "cawpile",
  Fantasy: "cawpile",
  "Graphic Novel": "cawpile",
  Romance: "hearted",
  Romantasy: "hearted",
  Memoir: "craft",
  "Self-Help": "craft",
  Business: "craft",
  Biography: "craft",
  Hobby: "craft",
  Craft: "craft",
};

export const DNF_REASONS = [
  "Slow pacing",
  "Unlikable characters",
  "Didn't click with the writing",
  "Too predictable",
  "Too triggering",
  "Lost interest in the plot",
  "Life got busy",
  "DNF for now, might retry",
] as const;

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  series: text("series"),
  genre: text("genre").notNull(),
  status: text("status").notNull().default("wishlist"),
  coverUrl: text("cover_url"),
  pages: integer("pages"),
  notes: text("notes"),
  ratingSystem: text("rating_system"),
  starRating: real("star_rating"),
  spiceRating: integer("spice_rating"),
  dnfReasons: text("dnf_reasons"), // JSON-encoded string array
  dateAdded: text("date_added").notNull(),
  dateStarted: text("date_started"),
  dateFinished: text("date_finished"),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
});

export const updateBookSchema = insertBookSchema.partial();

export type InsertBook = z.infer<typeof insertBookSchema>;
export type UpdateBook = z.infer<typeof updateBookSchema>;
export type Book = typeof books.$inferSelect;

// Ratings calculator sub-score shape (computed client-side, never persisted raw)
export const ratingInputSchema = z.object({
  bookId: z.number(),
  system: z.enum(RATING_SYSTEMS),
  scores: z.array(z.number().min(0).max(10)), // 7 for cawpile/hearted, 5 for craft
  spice: z.number().min(0).max(5).optional(),
});
export type RatingInput = z.infer<typeof ratingInputSchema>;
