import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useImportGoodreads } from "@/hooks/use-books";
import { useToast } from "@/hooks/use-toast";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [csvText, setCsvText] = useState("");
  const importGoodreads = useImportGoodreads();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!csvText.trim()) {
      toast({ title: "No data to import", description: "Paste or upload your Goodreads export first." });
      return;
    }
    try {
      const result = await importGoodreads.mutateAsync(csvText);
      toast({
        title: "Import complete",
        description: `${result.imported} new, ${result.updated} updated, ${result.skipped} skipped out of ${result.total} rows.`,
      });
      setCsvText("");
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Please check your file and try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-import">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Import from Goodreads</DialogTitle>
          <DialogDescription>
            Export your library from Goodreads (My Books → Import/Export) and upload the CSV, or paste its contents below.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
          data-testid="input-csv-file"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
          data-testid="button-choose-file"
        >
          <Upload className="mr-2 h-4 w-4" /> Choose CSV file
        </Button>

        <Textarea
          placeholder="...or paste CSV contents here"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="min-h-32 font-mono text-xs"
          data-testid="textarea-csv"
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-import">
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importGoodreads.isPending} data-testid="button-confirm-import">
            {importGoodreads.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
