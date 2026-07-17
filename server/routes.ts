import type { Express } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { storage, normalize } from "./storage";
import { insertBookSchema, updateBookSchema, GENRE_RATING_MAP } from "@shared/schema";
import { z } from "zod";

// --- Minimal CSV parser (handles quoted fields with embedded commas) ---
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;
  return body
    .filter((r) => r.length === header.length && r.some((c) => c.trim().length > 0))
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, idx) => (obj[h.trim()] = (r[idx] ?? "").trim()));
      return obj;
    });
}

// Extract series from a Goodreads-style title: "Book Title (Series Name, #1)"
function extractSeries(title: string): { title: string; series: string | null } {
  const match = title.match(/^(.*)\s\(([^,()]+)(?:,\s*#?\d+(?:\.\d+)?)?\)\s*$/);
  if (match) {
    return { title: match[1].trim(), series: match[2].trim() };
  }
  return { title: title.trim(), series: null };
}

function shelfToStatus(shelf: string): string {
  const s = shelf.toLowerCase().trim();
  if (s === "to-read") return "wishlist";
  if (s === "currently-reading") return "reading";
  if (s === "read") return "finished";
  if (s === "did-not-finish" || s === "dnf") return "dnf";
  return "wishlist";
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ---------- Books CRUD ----------
  app.get("/api/books", async (_req, res) => {
    const books = await storage.getBooks();
    res.json(books);
  });

  app.get("/api/books/:id", async (req, res) => {
    const book = await storage.getBook(Number(req.params.id));
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  });

  app.post("/api/books", async (req, res) => {
    try {
      const parsed = insertBookSchema.parse({
        dateAdded: new Date().toISOString(),
        ...req.body,
      });
      const book = await storage.createBook(parsed);
      res.status(201).json(book);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: err.errors });
      }
      throw err;
    }
  });

  app.patch("/api/books/:id", async (req, res) => {
    try {
      const parsed = updateBookSchema.parse(req.body);
      const book = await storage.updateBook(Number(req.params.id), parsed);
      if (!book) return res.status(404).json({ message: "Book not found" });
      res.json(book);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: err.errors });
      }
      throw err;
    }
  });

  app.delete("/api/books/:id", async (req, res) => {
    const result = await storage.deleteBook(Number(req.params.id));
    if (result.changes === 0) return res.status(404).json({ message: "Book not found" });
    res.status(204).end();
  });

  // ---------- Rating systems metadata ----------
  app.get("/api/rating-systems", async (_req, res) => {
    res.json(GENRE_RATING_MAP);
  });

  // ---------- Cover lookup proxy (Google Books API) ----------
  app.get("/api/cover-lookup", async (req, res) => {
    const { title, isbn } = req.query as { title?: string; isbn?: string };
    if (!title && !isbn) {
      return res.status(400).json({ message: "title or isbn query param required" });
    }
    try {
      const q = isbn ? `isbn:${isbn}` : `intitle:${encodeURIComponent(String(title))}`;
      const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`;
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(502).json({ message: "Cover lookup service unavailable" });
      }
      const data = await response.json();
      const items = (data.items || [])
        .map((item: any) => {
          const info = item.volumeInfo || {};
          const imageLinks = info.imageLinks || {};
          const thumb = imageLinks.thumbnail || imageLinks.smallThumbnail;
          return thumb
            ? {
                title: info.title,
                authors: info.authors,
                coverUrl: String(thumb).replace(/^http:/, "https:"),
              }
            : null;
        })
        .filter(Boolean);
      res.json({ results: items });
    } catch (err) {
      res.status(502).json({ message: "Cover lookup failed" });
    }
  });

  // ---------- Goodreads CSV import ----------
  app.post("/api/import/goodreads", async (req, res) => {
    const { csv } = req.body as { csv?: string };
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ message: "csv text is required" });
    }

    let rows: Record<string, string>[];
    try {
      rows = parseCsv(csv);
    } catch {
      return res.status(400).json({ message: "Could not parse CSV file" });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const rawTitle = row["Title"];
      if (!rawTitle) {
        skipped++;
        continue;
      }
      const { title, series } = extractSeries(rawTitle);
      const author = row["Author"]
        ? row["Additional Authors"]
          ? `${row["Author"]} & ${row["Additional Authors"]}`
          : row["Author"]
        : "Unknown";
      const status = shelfToStatus(row["Exclusive Shelf"] || "to-read");
      const pages = row["Number of Pages"] ? parseInt(row["Number of Pages"], 10) : undefined;
      const dateAdded = row["Date Added"] ? new Date(row["Date Added"]).toISOString() : new Date().toISOString();
      const dateFinished = row["Date Read"] ? new Date(row["Date Read"]).toISOString() : undefined;

      const existing = await storage.findByNormalizedTitle(title);

      if (existing) {
        await storage.updateBook(existing.id, {
          status,
          author,
          series: series ?? existing.series,
          pages: pages ?? existing.pages ?? undefined,
          dateFinished: dateFinished ?? existing.dateFinished ?? undefined,
        });
        updated++;
      } else {
        await storage.createBook({
          title,
          author,
          series,
          genre: "Fiction",
          status,
          coverUrl: null,
          pages: pages ?? null,
          notes: null,
          ratingSystem: null,
          starRating: null,
          spiceRating: null,
          dnfReasons: null,
          dateAdded,
          dateStarted: null,
          dateFinished: dateFinished ?? null,
        });
        imported++;
      }
    }

    res.json({ imported, updated, skipped, total: rows.length });
  });

  return httpServer;
}
