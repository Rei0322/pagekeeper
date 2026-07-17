import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Book, InsertBook, UpdateBook } from "@shared/schema";

const BOOKS_KEY = ["/api/books"];

export function useBooks() {
  return useQuery<Book[]>({ queryKey: BOOKS_KEY });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (book: InsertBook) => {
      const res = await apiRequest("POST", "/api/books", book);
      return (await res.json()) as Book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: UpdateBook }) => {
      const res = await apiRequest("PATCH", `/api/books/${id}`, patch);
      return (await res.json()) as Book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY });
    },
  });
}

export function useImportGoodreads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (csv: string) => {
      const res = await apiRequest("POST", "/api/import/goodreads", { csv });
      return (await res.json()) as { imported: number; updated: number; skipped: number; total: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOOKS_KEY });
    },
  });
}

export function useCoverLookup() {
  return useMutation({
    mutationFn: async ({ title, isbn }: { title?: string; isbn?: string }) => {
      const params = new URLSearchParams();
      if (title) params.set("title", title);
      if (isbn) params.set("isbn", isbn);
      const res = await apiRequest("GET", `/api/cover-lookup?${params.toString()}`);
      return (await res.json()) as { results: { title: string; authors?: string[]; coverUrl: string }[] };
    },
  });
}
