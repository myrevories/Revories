# Revories

An archive-first memory platform: a calm home for family photos, scans, and stories — with optional book-making.

**Hierarchy:** Project (umbrella archive) → Album (collection) → Assets. People, Places, Events and Tags are cross-linked metadata. Stories/Books are optional outputs built from archive content.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no environment variables set, the app runs in **demo mode**: an in-memory sample library (eight projects led by the "Martin Family Archive", plus a "Santorini Adventure" book), signed in as a demo user. Changes persist until the dev server restarts. Demo photos are hotlinked from Unsplash.

## Design

Screens follow the concept images: the homepage is built on the concept art (text removed, live HTML on top), and signed-in pages use frosted-glass panels over the terrace backdrop (`public/backgrounds/terrace.webp`), Noto Serif Display headings, Inter UI text, Caveat handwritten accents and a violet accent. Shared shell pieces live in `src/components/shell/` (top bar, project sidebar, backdrop).

## Stack

- **Next.js 16** (App Router, Cache Components) + React 19 + TypeScript
- **Tailwind CSS v4** — design tokens live in `src/app/globals.css`
- **Supabase** — Postgres + Auth (schema & RLS in `supabase/migrations/`)
- **Cloudflare R2** — media storage via presigned uploads (`src/app/api/uploads/presign`)
- **Leaflet + OpenStreetMap** for the Places map; Nominatim for place search

## Where things are

| Path | What |
| --- | --- |
| `src/lib/data.ts` | Data access layer. Demo in-memory store today; swap in Supabase with the same function signatures. |
| `src/lib/demo/seed.ts` | Demo data |
| `src/app/actions.ts` | Server actions (all mutations) |
| `src/components/ui.tsx` | Buttons, chips, avatars, empty states, stepper, etc. |
| `src/components/assets/` | Asset grid/list, multi-select, batch bar, right-side inspector |
| `src/components/review/` | Review & Organize workspace (batch metadata, face tagging, suggestions) |
| `src/components/upload/` | Dropzone, intake drawer, public upload-link form |
| `src/components/sharing/` | Share modal (invites, plain-English roles, upload links) |
| `src/components/studio/` | Storyboard planner + spread editor |
| `supabase/migrations/` | Postgres schema with row-level security |

## Routes

| Route | Purpose |
| --- | --- |
| `/` (and `/home`) | Marketing / public landing |
| `/dashboard` | Home after sign-in |
| `/projects` (Library), `/projects/new` | All projects / create |
| `/people`, `/places`, `/albums` | Across all projects |
| `/projects/[id]` | Project overview |
| `/projects/[id]/albums[/albumId]` | Albums (manual + smart) |
| `/projects/[id]/uploads` | Upload & Review (filters, batch actions, inspector) |
| `/projects/[id]/uploads/review` | One-by-one review with face tagging |
| `/projects/[id]/people`, `/places`, `/events[/eventId[/book]]` | People, places, timeline/events, book maker |
| `/projects/[id]/stories`, `/contributors`, `/settings/sharing`, `/trash` | Books, shared-project/contributor view, permissions, trash |
| `/stories`, `/stories/[id]/storyboard`, `/editor`, `/publish` | Books and the book studio |
| `/u/[token]` | Public upload-link page (no account needed) |
| `/upload`, `/search` | Global upload chooser, search |

## Environment

Copy `.env.example` to `.env.local`. See comments there for Supabase and R2 settings.
