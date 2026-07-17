import type { Book } from "@shared/schema";

export const STATUS_META: Record<
  string,
  { label: string; emptyTitle: string; emptyBody: string }
> = {
  wishlist: {
    label: "Wishlist",
    emptyTitle: "Your wishlist is empty",
    emptyBody: "Add books you're excited to pick up next.",
  },
  reading: {
    label: "Currently Reading",
    emptyTitle: "Nothing on your nightstand",
    emptyBody: "Move a book here once you crack it open.",
  },
  finished: {
    label: "Finished",
    emptyTitle: "No finished books yet",
    emptyBody: "Books you complete will land here, ready to rate.",
  },
  dnf: {
    label: "DNF Log",
    emptyTitle: "No DNFs logged",
    emptyBody: "Not every book is the right fit — that's alright.",
  },
};

export function nextStatusAction(status: string): { next: string; label: string } | null {
  if (status === "wishlist") return { next: "reading", label: "Start Reading" };
  if (status === "reading") return { next: "finished", label: "Mark Finished" };
  return null;
}

export function sortBooks(books: Book[]): Book[] {
  return [...books].sort((a, b) => a.title.localeCompare(b.title));
}
