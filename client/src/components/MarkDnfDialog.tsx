import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Book } from "@shared/schema";
import { DNF_REASONS } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { useUpdateBook } from "@/hooks/use-books";
import { useToast } from "@/hooks/use-toast";

interface MarkDnfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
}

export function MarkDnfDialog({ open, onOpenChange, book }: MarkDnfDialogProps) {
  const updateBook = useUpdateBook();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && book) {
      try {
        setSelected(book.dnfReasons ? JSON.parse(book.dnfReasons) : []);
      } catch {
        setSelected([]);
      }
    }
  }, [open, book]);

  async function handleConfirm() {
    if (!book) return;
    try {
      await updateBook.mutateAsync({
        id: book.id,
        patch: {
          status: "dnf",
          dnfReasons: selected.length > 0 ? JSON.stringify(selected) : null,
        },
      });
      toast({ title: "Moved to DNF Log", description: `"${book.title}" was logged as did-not-finish.` });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Couldn't update book",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-mark-dnf">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Log "{book.title}" as DNF</DialogTitle>
          <DialogDescription>
            Not every book is the right fit. Tag why it didn't work out, if you'd like.
          </DialogDescription>
        </DialogHeader>

        <ToggleGroup
          type="multiple"
          value={selected}
          onValueChange={setSelected}
          className="flex flex-wrap justify-start gap-2"
          data-testid="toggle-group-dnf-reasons"
        >
          {DNF_REASONS.map((reason) => (
            <ToggleGroupItem
              key={reason}
              value={reason}
              variant="outline"
              className="h-auto whitespace-normal rounded-full px-3 py-1.5 text-xs data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground"
              data-testid={`toggle-reason-${reason}`}
            >
              {reason}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-dnf">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={updateBook.isPending} data-testid="button-confirm-dnf">
            {updateBook.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log as DNF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
