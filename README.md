# Tp2 Guide

An interactive learning hub that generates **version-aware** software tutorials on demand.

Most written tutorials go stale because they fuse a concept with a path — "open Edit, then
Preferences, then Performance" — and the path breaks the moment a vendor reorganises a menu.
Tp2 Guide regenerates the path against the specific release you actually have installed.

## Features

- **Version-aware guides** — pick your exact release; instructions are generated for that build
- **Standard and Expert modes** — orientation for newcomers, configuration and failure modes for power users
- **Custom synthesis** — type any real application and get a curriculum for it
- **Step illustrations** — generated instructional visuals per step (requires a paid tier, see below)
- **Audio narration** — every step can be read aloud using the browser's built-in speech engine
- **Contextual AI mentor** — a chat assistant that knows which guide you are reading

## Requirements

- Node.js 20+
- A Gemini API key

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Add your API key**

   Copy `.env.example` to `.env.local` and fill in your key:

   ```bash
   cp .env.example .env.local
   ```

   ```
   GEMINI_API_KEY=your_key_here
   ```

   Get a key from https://aistudio.google.com/apikey. `.env.local` is gitignored — never
   commit a real key, and never expose it as a `VITE_*` variable (anything prefixed `VITE_`
   is inlined into the client bundle and is public).

3. **Run**

   ```bash
   npm run dev
   ```

   Vite serves the frontend on **http://localhost:3000** and the API server runs on **3001**.
   The key is read only by `server.mjs`; the browser never sees it.

## Production

```bash
npm run build
npm start
```

`npm start` serves the built `dist/` directory and the API from the same Express process.
In production the server honours `PORT`; in development it always binds `API_PORT` (default
3001) so an ambient `PORT` cannot silently move it away from Vite's proxy target.

## Architecture

```
index.tsx ──> App.tsx ──> components/
                            ├── Home, TutorialView, AIChat, Header
                            └── pages/ (Tips, Docs, API, Community, Insights, Legal)
                                  │
services/geminiService.ts ────────┘   client-side API wrapper
                │
                ▼
          server.mjs                  Express: rate limiting, prompt construction,
                │                     model fallback, image cache
                ▼
          Gemini API
```

Every AI call is isolated in `server.mjs` behind four endpoints (`/api/verify`, `/api/guide`,
`/api/chat`, `/api/image`). The frontend only ever talks to those, so swapping AI providers
means rewriting one file.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Read only by the server. |
| `API_PORT` | `3001` | Port for the API server. |
| `API_ORIGIN` | `http://localhost:3001` | Origin Vite proxies `/api` to in development. |
| `GEMINI_MODELS` | `gemini-3.6-flash,…` | Comma-separated model fallback list. |

## Notes on the free tier

- Text generation works on the free tier, but requests are **deprioritised under load** —
  expect occasional `503 high demand` responses and slow calls. The server automatically
  retries across the models in `GEMINI_MODELS` before giving up.
- **Image generation has no free tier.** Step illustrations will fail until billing is
  enabled; the UI degrades to a "visual unavailable" placeholder rather than breaking.
- Rate limits are enforced **per Google Cloud project**, not per key — extra keys in the same
  project share one quota pool.

## Caveats

Guides are AI-generated and are not reviewed before you see them. They are reliable about
structure and can be wrong about specifics such as exact menu labels. Verify anything
destructive — deleting data, editing a registry, changing permissions — against the vendor's
own documentation before running it.
