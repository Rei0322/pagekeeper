import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Book } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  RATING_SYSTEM_META,
  getRatingSystemForGenre,
  isSpiceGenre,
  computeStarRating,
} from "@/lib/ratings";
import { StarRating, SpiceRating } from "@/components/StarRating";
import { useUpdateBook } from "@/hooks/use-books";
import { useToast } from "@/hooks/use-toast";

interface RatingCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
}

export function RatingCalculatorDialog({ open, onOpenChange, book }: RatingCalculatorDialogProps) {
  const updateBook = useUpdateBook();
  const { toast } = useToast();
  const system = book ? getRatingSystemForGenre(book.genre) : null;
  const meta = system ? RATING_SYSTEM_META[system] : null;
  const spiceEligible = book ? isSpiceGenre(book.genre) : false;

  const [scores, setScores] = useState<number[]>([]);
  const [spice, setSpice] = useState(0);
  const [fallbackStars, setFallbackStars] = useState(3);

  useEffect(() => {
    if (open && meta) {
      setScores(meta.criteria.map(() => 7));
      setSpice(0);
      setFallbackStars(3);
    }
  }, [open, meta]);

  const computedStars = useMemo(() => {
    if (!meta) return fallbackStars;
    return computeStarRating(scores, meta.maxPerCriterion);
  }, [scores, meta, fallbackStars]);

  async function handleSave() {
    if (!book) return;
    try {
      await updateBook.mutateAsync({
        id: book.id,
        patch: {
          ratingSystem: system,
          starRating: computedStars,
          spiceRating: spiceEligible ? spice : null,
        },
      });
      toast({ title: "Rating saved", description: `"${book.title}" is now rated ${computedStars.toFixed(2)} stars.` });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Couldn't save rating",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" data-testid="dialog-rating-calculator">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Rate "{book.title}"</DialogTitle>
          <DialogDescription>
            {meta
              ? `Using the ${meta.label} scale for ${book.genre} books.`
              : `${book.genre} doesn't have a dedicated scale yet — use the quick star rating below.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Live preview</span>
          <div className="flex items-center gap-2">
            <StarRating stars={computedStars} />
            {spiceEligible && spice > 0 && <SpiceRating spice={spice} />}
          </div>
        </div>

        {meta ? (
          <div className="space-y-4">
            {meta.criteria.map((criterion, idx) => (
              <div key={criterion.key} className="space-y-1.5" data-testid={`criterion-${criterion.key}`}>
                <div className="flex items-baseline justify-between">
                  <label className="text-sm font-medium">{criterion.label}</label>
                  <span className="text-xs text-muted-foreground">{scores[idx] ?? 0}/10 · {criterion.hint}</span>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={[scores[idx] ?? 0]}
                  onValueChange={([v]) =>
                    setScores((prev) => prev.map((s, i) => (i === idx ? v : s)))
                  }
                  data-testid={`slider-${criterion.key}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium">Overall rating</label>
              <span className="text-xs text-muted-foreground">{fallbackStars}/5 stars</span>
            </div>
            <Slider
              min={0}
              max={5}
              step={0.5}
              value={[fallbackStars]}
              onValueChange={([v]) => setFallbackStars(v)}
              data-testid="slider-fallback"
            />
          </div>
        )}

        {spiceEligible && (
          <div className="space-y-1.5 border-t border-border pt-4">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-medium">Spice level 🌶️</label>
              <span className="text-xs text-muted-foreground">{spice}/5</span>
            </div>
            <Slider
              min={0}
              max={5}
              step={1}
              value={[spice]}
              onValueChange={([v]) => setSpice(v)}
              data-testid="slider-spice"
            />
            <p className="text-xs text-muted-foreground">From closed-door to explicit — rate the heat level.</p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-rating">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateBook.isPending} data-testid="button-save-rating">
            {updateBook.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
