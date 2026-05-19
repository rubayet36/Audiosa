# Audiosa

Audiosa is a React PWA music app built with Vite. It supports music discovery, playback, in-app downloads, recommendations, and partner song sharing through Supabase.

## Local Development

Install dependencies in both the app and proxy folders:

```bash
npm install
cd proxy
npm install
```

Run the backend proxy:

```bash
cd proxy
npm run dev
```

Run the React app:

```bash
npm run dev -- --host 0.0.0.0
```

Open:

```text
http://localhost:5173
```

For phone testing on the same Wi-Fi, open:

```text
http://YOUR_COMPUTER_IP:5173
```

## Netlify

The React app can be hosted on Netlify, but the music search, stream, lyrics, and download features require the proxy backend. A static Netlify deploy alone will not make downloads or playback work.

Recommended setup:

- Host the frontend on Netlify.
- Host the `proxy` server separately on a Node-capable host such as Render, Railway, Fly.io, or a VPS.
- Update the frontend API base URL for production, or add Netlify redirects that forward `/api/*` to the deployed proxy.

## Supabase

Run `supabase_schema.sql` in the Supabase SQL Editor to add:

- listening history
- partner shared tracks

Set these environment variables in production:

```text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-deployed-proxy-domain.com/api
```

`VITE_API_BASE_URL` must point to the deployed Node proxy. Without it, Netlify will return the React `index.html` for `/api` requests, which causes JSON parse errors in the app.

Use the Supabase project URL only:

```text
VITE_SUPABASE_URL=https://mstoweurzmfoshlwbpkg.supabase.co
```

Do not use:

```text
https://mstoweurzmfoshlwbpkg.supabase.co/rest/v1
```
