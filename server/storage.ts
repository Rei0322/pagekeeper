import { books } from "@shared/schema";
import type { Book, InsertBook, UpdateBook } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    series TEXT,
    genre TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'wishlist',
    cover_url TEXT,
    pages INTEGER,
    notes TEXT,
    rating_system TEXT,
    star_rating REAL,
    spice_rating INTEGER,
    dnf_reasons TEXT,
    date_added TEXT NOT NULL,
    date_started TEXT,
    date_finished TEXT
  );
`);

export interface IStorage {
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: UpdateBook): Promise<Book | undefined>;
  deleteBook(id: number): Promise<{ changes: number }>;
  findByNormalizedTitle(title: string): Promise<Book | undefined>;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/^(the |a |an )/i, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export class DatabaseStorage implements IStorage {
  async getBooks(): Promise<Book[]> {
    return db.select().from(books).all();
  }

  async getBook(id: number): Promise<Book | undefined> {
    return db.select().from(books).where(eq(books.id, id)).get();
  }

  async createBook(book: InsertBook): Promise<Book> {
    return db.insert(books).values(book).returning().get();
  }

  async updateBook(id: number, patch: UpdateBook): Promise<Book | undefined> {
    return db.update(books).set(patch).where(eq(books.id, id)).returning().get();
  }

  async deleteBook(id: number): Promise<{ changes: number }> {
    return db.delete(books).where(eq(books.id, id)).run();
  }

  async findByNormalizedTitle(title: string): Promise<Book | undefined> {
    const all = await this.getBooks();
    const target = normalize(title);
    return all.find((b) => normalize(b.title) === target);
  }
}

export const storage = new DatabaseStorage();
export { normalize };
