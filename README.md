# PageKeeper

A full-stack digital library for tracking books across a reading lifecycle — wishlist, reading, finished, and DNF — with genre-aware rating systems.

**Live demo:** https://pagekeeper.pplx.app

## Features

- Track books by status: wishlist, currently reading, finished, or did-not-finish
- Genre-gated rating systems: CAWPILE for fiction genres, a "hearted" scale for romance/romantasy, and a craft scale for nonfiction
- Automatic cover lookup by title/author
- Goodreads CSV import
- Light and dark mode

## Tech stack

Express · React · Vite · Tailwind CSS · shadcn/ui · Drizzle ORM · SQLite · TanStack Query · Zod

## Run locally

```bash
npm install
npm run dev      # http://localhost:5000
```

Production build:

```bash
npm run build
npm start
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/books` | List books |
| GET | `/api/books/:id` | Get one book |
| POST | `/api/books` | Add a book |
| PATCH | `/api/books/:id` | Update a book |
| DELETE | `/api/books/:id` | Remove a book |
| GET | `/api/rating-systems` | Rating system definitions |
| GET | `/api/cover-lookup` | Look up a cover image |
| POST | `/api/import/goodreads` | Import a Goodreads export |

## Author

Samira Ray — [GitHub](https://github.com/Rei0322) · [LinkedIn](https://www.linkedin.com/in/samira-ray-44a58714a/)

## License

MIT — see [LICENSE](LICENSE).
