import { starsToVisual, spiceToVisual } from "@/lib/ratings";

export function StarRating({ stars, className = "" }: { stars: number | null | undefined; className?: string }) {
  return (
    <span className={`text-accent tracking-tight ${className}`} data-testid="text-star-rating">
      {starsToVisual(stars)}
      {stars ? <span className="ml-1 text-xs text-muted-foreground">{stars.toFixed(2)}</span> : null}
    </span>
  );
}

export function SpiceRating({ spice, className = "" }: { spice: number | null | undefined; className?: string }) {
  const visual = spiceToVisual(spice);
  if (!visual) return null;
  return (
    <span className={`text-sm ${className}`} data-testid="text-spice-rating">
      {visual}
    </span>
  );
}
