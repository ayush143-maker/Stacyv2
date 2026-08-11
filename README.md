# Stacy — V2

React + Vite frontend, Gemini key kept strictly server-side.

```
Stacy Frontend
      ↓
src/lib/gemini.js        (calls "/api/chat" only — no key here)
      ↓
/api/chat                (reads process.env.GEMINI_API_KEY — only place it exists)
      ↓
Gemini 3.6 Flash
```

`GEMINI_API_KEY` is never referenced with a `VITE_` prefix, never sent to the
client, and never included in any `/api/chat` response or error message.

## Local development

Two processes run side by side: Vite (frontend) and a tiny Express wrapper
around the same `api/chat.js` handler that runs in production.

```bash
npm install
cp .env.local.example .env.local   # if you renamed it — otherwise just edit .env.local
# put your real key in .env.local

npm run server   # terminal 1 — API on :3001
npm run dev      # terminal 2 — frontend on :5173, proxies /api to :3001
```

Open http://localhost:5173.

Alternative: if you use the Vercel CLI, `vercel dev` will run `api/chat.js`
directly with the same env var and you can skip `server.dev.js` entirely.

## Production (Vercel)

1. Push this repo to GitHub and import it in Vercel, or run `vercel`.
2. In the project's Environment Variables settings, add `GEMINI_API_KEY`
   (Production + Preview). Do **not** add a `VITE_`-prefixed copy.
3. Vercel builds the Vite app and deploys `api/chat.js` as a serverless
   function automatically — no extra config needed.

Any other Node-capable host works too, as long as `api/chat.js` runs as a
server-side endpoint at `/api/chat` and `GEMINI_API_KEY` is set as a server
environment variable, never shipped to the client bundle.

## Structure

- `public/expressions/*.png` — the six mood portraits, preloaded on load.
- `src/components/` — `CharacterStage` + `Character` (crossfade), `Chat` +
  `Message` + `ChatInput` (conversation), `Header`.
- `src/lib/gemini.js` — client fetch wrapper, talks only to `/api/chat`.
- `src/lib/expressionEngine.js` — mood list + local fallback classifier.
- `src/lib/storage.js` — session-only chat history persistence (never keys).
- `api/chat.js` — the only place `GEMINI_API_KEY` is read; builds the
  Gemini request, parses the `{reply, mood}` JSON envelope, returns it.
- `server.dev.js` — local-only Express wrapper so `api/chat.js` runs the
  same way in dev and prod.
