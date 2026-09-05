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
| `GEMINI_API_KEY` | — | Required for images/video, and for text unless `TEXT_PROVIDER=openai`. |
| `API_PORT` | `3001` | Port for the API server. |
| `API_ORIGIN` | `http://localhost:3001` | Origin Vite proxies `/api` to in development. |
| `GEMINI_MODELS` | `gemini-3.6-flash,…` | Comma-separated Gemini fallback list. |
| `TEXT_PROVIDER` | `gemini` | `gemini` or `openai` (any OpenAI-compatible endpoint). |
| `OPENAI_BASE_URL` | NVIDIA NIM | Base URL when `TEXT_PROVIDER=openai`. |
| `OPENAI_API_KEY` | — | Key for that endpoint. |
| `OPENAI_MODELS` | `nvidia/nemotron-3-super-120b-a12b,…` | Comma-separated fallback list. |
| `OPENAI_JSON_MODE` | `schema` | `schema` (json_schema) or `object` (json_object). |
| `OPENAI_MAX_TOKENS` | `12000` | Output ceiling. Too low truncates a guide into unparseable JSON. |
| `UPSTREAM_TIMEOUT_MS` | `45000` | How long to wait on one model before falling through to the next. |
| `OPENAI_EXTRA_BODY` | — | JSON merged into the request body, for provider-specific settings. |
| `TAVILY_API_KEY` | — | Enables web research before writing a guide. Free tier, optional. |
| `RESEARCH_MAX_RESULTS` | `5` | Pages fed into the prompt per guide. |
| `RESEARCH_TIMEOUT_MS` | `12000` | Wait before giving up and writing from recall. |
| `RATE_LIMIT_PER_MIN` | `8` | Requests per minute per IP against the AI routes. |
| `ENABLE_VIDEO` | `false` | Turns on Veo step videos. **Billable — see below.** |
| `VEO_MODEL` | `veo-3.1-fast-generate-preview` | Which Veo model to use. |

### Switching the text provider

Gemini's free tier deprioritises traffic heavily, so `503 high demand` refusals
are common enough to make the app feel broken. Every AI call goes through one
function in `server.mjs`, so any **OpenAI-compatible** endpoint can serve text
instead — no frontend changes:

```
TEXT_PROVIDER=openai
OPENAI_BASE_URL=https://integrate.api.nvidia.com/v1
OPENAI_API_KEY=nvapi-...
OPENAI_MODELS=nvidia/nemotron-3-super-120b-a12b,openai/gpt-oss-20b
OPENAI_EXTRA_BODY={"chat_template_kwargs":{"thinking":false}}
```

NVIDIA NIM's free tier allows roughly **40 requests/minute** against Gemini's
~10. Groq, OpenRouter, Together and a local Ollama work identically — only the
base URL, key and model names change. `OPENAI_MODELS` is comma-separated and
gets the same fall-through-on-busy behaviour as `GEMINI_MODELS`.

### Choosing a model

Pick by **throughput**, not by reputation. A guide is several thousand output
tokens, so tokens/sec decides whether it arrives before the client gives up at
120s. Measured against the same free NVIDIA endpoint, same prompt:

| Model | Throughput | Full guide |
|---|---|---|
| `nvidia/nemotron-3-super-120b-a12b` | ~110 tok/s | **16–22s** |
| `openai/gpt-oss-20b` | ~26 tok/s | timed out at 150s |
| `moonshotai/kimi-k3` | queued | a 16-token reply took over 2 minutes |

For comparison, Gemini 3.6 Flash produced the same guide in ~20s, after being
rate-limited on the first attempt and falling through to a second model.

Two things to watch:

- **Model names go stale.** `meta/llama-3.3-70b-instruct` now returns `410
  Gone`, which silently left the deployment with no fallback at all. Check a
  candidate against `GET {OPENAI_BASE_URL}/models` before adding it.
- **Reasoning models spend output budget thinking**, and that scratchpad counts
  against `OPENAI_MAX_TOKENS` — enough to truncate a guide mid-JSON. Turn it off
  through `OPENAI_EXTRA_BODY`; the spelling is provider-specific, which is why
  it is opaque config rather than a first-class field.

Two caveats:

- **Images and video stay on Gemini** and still need `GEMINI_API_KEY`.
  OpenAI-compatible chat endpoints do not generate images.
- Structured output depends on the model. Newer ones (Kimi K3 among them)
  accept `response_format: json_schema`, which constrains generation the way
  Gemini's `responseSchema` does; the app converts its schemas automatically.
  Set `OPENAI_JSON_MODE=object` for models that reject it, which falls back to
  `json_object` plus a described shape.

`GET /api/capabilities` reports what a given deployment can actually do, and the
UI hides what it cannot.

### Video generation

Off by default. Veo has **no free tier**, so a free-tier key returns `429` on
every request — the button would fail for everyone. Enable it only with billing
turned on:

```
ENABLE_VIDEO=true
```

The UI asks `/api/capabilities` on load and hides the control entirely when the
server cannot do it, rather than offering a button that always fails.

Two things worth knowing before you turn it on: generation takes **minutes** per
clip (started, polled, then served across three requests), and Veo *imagines* an
interface rather than recording the real one. The result is labelled as an
illustration for that reason — for a guide whose value is version-accuracy, a
plausible-but-invented UI can mislead more than it helps.

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
