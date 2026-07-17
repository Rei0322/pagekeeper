import { GENRE_RATING_MAP } from "@shared/schema";

export type RatingSystem = "cawpile" | "hearted" | "craft";

export interface RatingCriterion {
  key: string;
  label: string;
  hint: string;
}

export const CAWPILE_CRITERIA: RatingCriterion[] = [
  { key: "characters", label: "Characters", hint: "Did you connect with them?" },
  { key: "atmosphere", label: "Atmosphere", hint: "Setting, mood, immersion" },
  { key: "writing", label: "Writing", hint: "Prose style and voice" },
  { key: "plot", label: "Plot", hint: "Story structure and pacing" },
  { key: "intrigue", label: "Intrigue", hint: "How hooked were you?" },
  { key: "logic", label: "Logic", hint: "Did it hold together?" },
  { key: "enjoyment", label: "Enjoyment", hint: "Overall gut feeling" },
];

export const HEARTED_CRITERIA: RatingCriterion[] = [
  { key: "heart", label: "Heart", hint: "Emotional core of the romance" },
  { key: "execution", label: "Execution", hint: "How well the tropes landed" },
  { key: "attraction", label: "Attraction", hint: "Chemistry between leads" },
  { key: "relationship", label: "Relationship", hint: "Growth of the connection" },
  { key: "tension", label: "Tension", hint: "Push and pull, longing" },
  { key: "enjoyment", label: "Enjoyment", hint: "Overall gut feeling" },
  { key: "denouement", label: "Denouement", hint: "How satisfying was the ending?" },
];

export const CRAFT_CRITERIA: RatingCriterion[] = [
  { key: "clarity", label: "Clarity", hint: "Was the message clear?" },
  { key: "relevance", label: "Relevance", hint: "Did it apply to your life?" },
  { key: "authority", label: "Authority", hint: "Did you trust the author?" },
  { key: "flow", label: "Flow", hint: "Structure and readability" },
  { key: "takeaways", label: "Takeaways", hint: "What will you remember?" },
];

export const RATING_SYSTEM_META: Record<
  RatingSystem,
  { label: string; criteria: RatingCriterion[]; maxPerCriterion: number }
> = {
  cawpile: { label: "CAWPILE", criteria: CAWPILE_CRITERIA, maxPerCriterion: 10 },
  hearted: { label: "HEARTED", criteria: HEARTED_CRITERIA, maxPerCriterion: 10 },
  craft: { label: "CRAFT", criteria: CRAFT_CRITERIA, maxPerCriterion: 10 },
};

export function getRatingSystemForGenre(genre: string): RatingSystem | null {
  return (GENRE_RATING_MAP as Record<string, RatingSystem>)[genre] ?? null;
}

export function isSpiceGenre(genre: string): boolean {
  return genre === "Romance" || genre === "Romantasy";
}

export function computeStarRating(scores: number[], maxPerCriterion: number): number {
  const maxScore = scores.length * maxPerCriterion;
  if (maxScore === 0) return 0;
  const total = scores.reduce((a, b) => a + b, 0);
  return Math.round((total / maxScore) * 5 * 100) / 100;
}

export function starsToVisual(stars: number | null | undefined): string {
  if (stars === null || stars === undefined) return "☆☆☆☆☆";
  if (stars >= 4.5) return "★★★★★";
  if (stars >= 3.5) return "★★★★☆";
  if (stars >= 2.5) return "★★★☆☆";
  if (stars >= 1.5) return "★★☆☆☆";
  if (stars > 0) return "★☆☆☆☆";
  return "☆☆☆☆☆";
}

export function spiceToVisual(spice: number | null | undefined): string {
  if (!spice || spice <= 0) return "";
  const rounded = Math.round(spice);
  return "🌶️".repeat(Math.min(5, Math.max(0, rounded)));
}
