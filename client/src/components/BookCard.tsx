import { BookOpen, MoreVertical, Pencil, Sparkles, Trash2, XCircle } from "lucide-react";
import type { Book } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StarRating, SpiceRating } from "@/components/StarRating";
import { nextStatusAction } from "@/lib/status";

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onRate: (book: Book) => void;
  onAdvanceStatus: (book: Book, next: string) => void;
  onMarkDnf: (book: Book) => void;
}

function CoverPlaceholder({ title }: { title: string }) {
  const initial = title.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/25 to-accent/25"
      data-testid="img-cover-placeholder"
    >
      <span className="font-serif text-xl text-primary/70">{initial}</span>
    </div>
  );
}

export function BookCard({ book, onEdit, onDelete, onRate, onAdvanceStatus, onMarkDnf }: BookCardProps) {
  const advance = nextStatusAction(book.status);

  return (
    <Card
      className="group flex flex-col overflow-hidden"
      data-testid={`card-book-${book.id}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover"
            data-testid={`img-cover-${book.id}`}
          />
        ) : (
          <CoverPlaceholder title={book.title} />
        )}
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 shadow-sm"
                data-testid={`button-menu-${book.id}`}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(book)} data-testid={`button-edit-${book.id}`}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit details
              </DropdownMenuItem>
              {book.status === "finished" && (
                <DropdownMenuItem onClick={() => onRate(book)} data-testid={`button-rate-${book.id}`}>
                  <Sparkles className="mr-2 h-3.5 w-3.5" /> Rate this book
                </DropdownMenuItem>
              )}
              {advance && (
                <DropdownMenuItem
                  onClick={() => onAdvanceStatus(book, advance.next)}
                  data-testid={`button-advance-${book.id}`}
                >
                  <BookOpen className="mr-2 h-3.5 w-3.5" /> {advance.label}
                </DropdownMenuItem>
              )}
              {book.status !== "dnf" && (
                <DropdownMenuItem onClick={() => onMarkDnf(book)} data-testid={`button-dnf-${book.id}`}>
                  <XCircle className="mr-2 h-3.5 w-3.5" /> Mark as DNF
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(book)}
                className="text-destructive"
                data-testid={`button-delete-${book.id}`}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3
          className="font-serif text-sm font-semibold leading-snug text-card-foreground line-clamp-2"
          data-testid={`text-title-${book.id}`}
        >
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1" data-testid={`text-author-${book.id}`}>
          {book.author}
        </p>
        {book.series && (
          <Badge variant="outline" className="w-fit text-xs" data-testid={`badge-series-${book.id}`}>
            {book.series}
          </Badge>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          <Badge variant="secondary" className="text-xs" data-testid={`badge-genre-${book.id}`}>
            {book.genre}
          </Badge>
          <div className="flex flex-col items-end gap-0.5">
            {book.starRating ? <StarRating stars={book.starRating} /> : null}
            <SpiceRating spice={book.spiceRating} />
          </div>
        </div>
      </div>
    </Card>
  );
}
