import { useMemo, useState } from "react";
import { Plus, Upload, Moon, Sun, BookMarked, Library as LibraryIcon, Flame, Ban } from "lucide-react";
import type { Book } from "@shared/schema";
import { STATUSES } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/Logo";
import { BookCard } from "@/components/BookCard";
import { BookFormDialog } from "@/components/BookFormDialog";
import { RatingCalculatorDialog } from "@/components/RatingCalculatorDialog";
import { MarkDnfDialog } from "@/components/MarkDnfDialog";
import { ImportDialog } from "@/components/ImportDialog";
import { useBooks, useDeleteBook, useUpdateBook } from "@/hooks/use-books";
import { useToast } from "@/hooks/use-toast";
import { STATUS_META, sortBooks } from "@/lib/status";
import { useTheme } from "@/components/ThemeProvider";

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wishlist: BookMarked,
  reading: LibraryIcon,
  finished: Flame,
  dnf: Ban,
};

export default function Library() {
  const { data: books, isLoading } = useBooks();
  const deleteBook = useDeleteBook();
  const updateBook = useUpdateBook();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<string>("wishlist");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [ratingBook, setRatingBook] = useState<Book | null>(null);
  const [dnfBook, setDnfBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<string, Book[]> = { wishlist: [], reading: [], finished: [], dnf: [] };
    for (const book of books ?? []) {
      (map[book.status] ??= []).push(book);
    }
    for (const key of Object.keys(map)) map[key] = sortBooks(map[key]);
    return map;
  }, [books]);

  const stats = useMemo(() => {
    const all = books ?? [];
    const finished = all.filter((b) => b.status === "finished");
    const rated = finished.filter((b) => b.starRating);
    const avg = rated.length
      ? rated.reduce((sum, b) => sum + (b.starRating ?? 0), 0) / rated.length
      : null;
    return {
      total: all.length,
      reading: all.filter((b) => b.status === "reading").length,
      finished: finished.length,
      avgRating: avg,
    };
  }, [books]);

  async function handleAdvanceStatus(book: Book, next: string) {
    try {
      await updateBook.mutateAsync({ id: book.id, patch: { status: next } });
      toast({ title: "Status updated", description: `"${book.title}" moved to ${STATUS_META[next].label}.` });
    } catch (err) {
      toast({
        title: "Couldn't update status",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleConfirmDelete() {
    if (!deletingBook) return;
    try {
      await deleteBook.mutateAsync(deletingBook.id);
      toast({ title: "Book removed", description: `"${deletingBook.title}" was removed from your library.` });
    } catch (err) {
      toast({
        title: "Couldn't remove book",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingBook(null);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5 text-primary">
            <Logo className="h-8 w-8" />
            <div>
              <h1 className="font-serif text-lg font-semibold text-foreground" data-testid="text-app-title">
                PageKeeper
              </h1>
              <p className="text-xs text-muted-foreground">Your reading life, organized</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)} data-testid="button-open-import">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
            <Button
              onClick={() => {
                setEditingBook(null);
                setFormOpen(true);
              }}
              data-testid="button-open-add"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Book
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total books" value={stats.total} testId="total" />
          <StatCard label="Currently reading" value={stats.reading} testId="reading" />
          <StatCard label="Finished" value={stats.finished} testId="finished" />
          <StatCard
            label="Avg. rating"
            value={stats.avgRating ? stats.avgRating.toFixed(2) : "—"}
            testId="avg-rating"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5 flex-wrap">
            {STATUSES.map((status) => {
              const Icon = TAB_ICONS[status];
              return (
                <TabsTrigger key={status} value={status} className="gap-1.5" data-testid={`tab-${status}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {STATUS_META[status].label}
                  <span className="ml-1 text-xs text-muted-foreground">({grouped[status]?.length ?? 0})</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {STATUSES.map((status) => (
            <TabsContent key={status} value={status}>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
                  ))}
                </div>
              ) : grouped[status]?.length ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {grouped[status].map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onEdit={(b) => {
                        setEditingBook(b);
                        setFormOpen(true);
                      }}
                      onDelete={setDeletingBook}
                      onRate={setRatingBook}
                      onAdvanceStatus={handleAdvanceStatus}
                      onMarkDnf={setDnfBook}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState status={status} onAdd={() => { setEditingBook(null); setFormOpen(true); }} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <BookFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        book={editingBook}
        defaultStatus={activeTab}
      />
      <RatingCalculatorDialog open={Boolean(ratingBook)} onOpenChange={(o) => !o && setRatingBook(null)} book={ratingBook} />
      <MarkDnfDialog open={Boolean(dnfBook)} onOpenChange={(o) => !o && setDnfBook(null)} book={dnfBook} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={Boolean(deletingBook)} onOpenChange={(o) => !o && setDeletingBook(null)}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deletingBook?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this book from your library. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive"
              data-testid="button-confirm-delete"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value, testId }: { label: string; value: string | number; testId: string }) {
  return (
    <div className="rounded-lg border border-card-border bg-card px-4 py-3" data-testid={`stat-${testId}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-serif text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ status, onAdd }: { status: string; onAdd: () => void }) {
  const meta = STATUS_META[status];
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <BookMarked className="mb-3 h-8 w-8 text-muted-foreground" />
      <h3 className="font-serif text-lg font-semibold text-foreground">{meta.emptyTitle}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{meta.emptyBody}</p>
      {status === "wishlist" && (
        <Button className="mt-4" onClick={onAdd} data-testid="button-empty-add">
          <Plus className="mr-2 h-4 w-4" /> Add your first book
        </Button>
      )}
    </div>
  );
}
