# Audiosa

Audiosa is a React PWA music app built with Vite. It uses Jamendo for legal music search, streaming, and artist-approved downloads, plus Supabase for partner sharing.

## Local Development

Install dependencies:

```bash
npm install
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

The app can be hosted as a static Netlify site. A separate Render proxy is no longer required for normal search, playback, or downloads because Jamendo provides public stream and download URLs.

Use these Netlify settings:

```text
Build command: npm run build
Publish directory: dist
```

Set these environment variables in Netlify:

```text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_JAMENDO_CLIENT_ID=your_jamendo_client_id
```

The current Jamendo client ID used during development is:

```text
VITE_JAMENDO_CLIENT_ID=c672fb4c
```

## Supabase

Run `supabase_schema.sql` in the Supabase SQL Editor to add:

- listening history
- partner shared tracks

Use the Supabase project URL only:

```text
VITE_SUPABASE_URL=https://mstoweurzmfoshlwbpkg.supabase.co
```

Do not use:

```text
https://mstoweurzmfoshlwbpkg.supabase.co/rest/v1
```

## Legacy Proxy

The `proxy/` folder is still in the repo from the previous YouTube-based version, but Audiosa no longer depends on it after the Jamendo switch.
