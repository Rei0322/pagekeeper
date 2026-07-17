import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2 } from "lucide-react";
import type { Book } from "@shared/schema";
import { GENRES, STATUSES } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBook, useUpdateBook, useCoverLookup } from "@/hooks/use-books";
import { useToast } from "@/hooks/use-toast";
import { STATUS_META } from "@/lib/status";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  series: z.string().optional(),
  genre: z.enum(GENRES),
  status: z.enum(STATUSES),
  pages: z.string().optional(),
  coverUrl: z.string().optional(),
  notes: z.string().optional(),
  dateStarted: z.string().optional(),
  dateFinished: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function defaultValuesFor(book?: Book | null): FormValues {
  if (!book) {
    return {
      title: "",
      author: "",
      series: "",
      genre: "Fiction",
      status: "wishlist",
      pages: "",
      coverUrl: "",
      notes: "",
      dateStarted: "",
      dateFinished: "",
    };
  }
  return {
    title: book.title,
    author: book.author,
    series: book.series ?? "",
    genre: book.genre as FormValues["genre"],
    status: book.status as FormValues["status"],
    pages: book.pages ? String(book.pages) : "",
    coverUrl: book.coverUrl ?? "",
    notes: book.notes ?? "",
    dateStarted: toDateInput(book.dateStarted),
    dateFinished: toDateInput(book.dateFinished),
  };
}

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
  defaultStatus?: string;
}

export function BookFormDialog({ open, onOpenChange, book, defaultStatus }: BookFormDialogProps) {
  const isEdit = Boolean(book);
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const coverLookup = useCoverLookup();
  const { toast } = useToast();
  const [coverResults, setCoverResults] = useState<{ title: string; coverUrl: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValuesFor(book),
  });

  useEffect(() => {
    if (open) {
      const values = defaultValuesFor(book);
      if (!book && defaultStatus) values.status = defaultStatus as FormValues["status"];
      form.reset(values);
      setCoverResults([]);
    }
  }, [open, book, defaultStatus]);

  async function onSubmit(values: FormValues) {
    const payload = {
      title: values.title.trim(),
      author: values.author.trim(),
      series: values.series?.trim() || null,
      genre: values.genre,
      status: values.status,
      pages: values.pages ? parseInt(values.pages, 10) : null,
      coverUrl: values.coverUrl?.trim() || null,
      notes: values.notes?.trim() || null,
      dateStarted: values.dateStarted ? new Date(values.dateStarted).toISOString() : null,
      dateFinished: values.dateFinished ? new Date(values.dateFinished).toISOString() : null,
    };

    try {
      if (isEdit && book) {
        await updateBook.mutateAsync({ id: book.id, patch: payload });
        toast({ title: "Book updated", description: `"${values.title}" was saved.` });
      } else {
        await createBook.mutateAsync({
          ...payload,
          ratingSystem: null,
          starRating: null,
          spiceRating: null,
          dnfReasons: null,
        } as any);
        toast({ title: "Book added", description: `"${values.title}" is now in your library.` });
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleCoverLookup() {
    const title = form.getValues("title");
    if (!title) {
      toast({ title: "Enter a title first", description: "We need a title to search covers." });
      return;
    }
    try {
      const result = await coverLookup.mutateAsync({ title });
      setCoverResults(result.results);
      if (result.results.length === 0) {
        toast({ title: "No covers found", description: "Try a different or shorter title." });
      }
    } catch {
      toast({ title: "Cover lookup failed", description: "Please try again later.", variant: "destructive" });
    }
  }

  const isPending = createBook.isPending || updateBook.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto" data-testid="dialog-book-form">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{isEdit ? "Edit Book" : "Add a Book"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details for this title." : "Add a new title to your library."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="The Night Circus" {...field} data-testid="input-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input placeholder="Erin Morgenstern" {...field} data-testid="input-author" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="series"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Series (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Six of Crows" {...field} data-testid="input-series" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pages (optional)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="352" {...field} data-testid="input-pages" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-genre">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENRES.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_META[s].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="coverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover image URL</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-cover-url" />
                    </FormControl>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCoverLookup}
                      disabled={coverLookup.isPending}
                      data-testid="button-cover-lookup"
                    >
                      {coverLookup.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {coverResults.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {coverResults.map((r, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => form.setValue("coverUrl", r.coverUrl)}
                          className="shrink-0 overflow-hidden rounded-md border border-border hover-elevate"
                          data-testid={`button-select-cover-${i}`}
                        >
                          <img src={r.coverUrl} alt={r.title} className="h-24 w-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="dateStarted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date started</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date-started" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateFinished"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date finished</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-date-finished" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Thoughts, quotes, why you want to read it..." {...field} data-testid="input-notes" />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit-book">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save Changes" : "Add Book"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
