# Deploying Laveeda

The build output in `dist/` is static: one HTML file, one JS chunk, one CSS file, icons and a
service worker. Any static host that can serve those paths works. The only host-specific setting
is **`base`**, because the service worker scope and the manifest's `start_url` must match the path
the app is actually served from.

---

## GitHub Pages (ready to go)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`, with
`VITE_BASE=/<repository-name>/` so assets, the manifest and the SW scope all line up under the
project-page subpath.

1. Push this branch to `main` (or open a PR and merge it).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Open the deployed URL (`https://<user>.github.io/laveeda-world-clock/`).

Build the same way locally to sanity-check the subpath:

```bash
npm run build:pages
npx serve dist   # or: python3 -m http.server -d dist 4173
```

> Pages serves `404.html` for unknown paths only if you add one. This app is a single page and
> every deep link is a *query string* (`?view=compare&t=9:30`), never a path, so no SPA rewrite
> rule is needed. That is deliberate: it keeps hosting config to zero.

## Netlify / Vercel / Cloudflare Pages / any bucket

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish/output directory | `dist` |
| Install command | `npm ci` |
| Base path | leave `VITE_BASE` unset (root of the domain) |

For a **custom domain at the root**, nothing else is required — HTTPS is what makes installing
possible, and all three hosts give it to you by default.

For a **subdirectory** on those hosts, set the base explicitly:

```bash
VITE_BASE=/laves/ npm run build
```

## Why the HTTPS part is not a detail

Installation requires a secure context. On `http://` (other than `localhost`) the browser will
not fire `beforeinstallprompt`, will not register the service worker, and iOS will not offer
*Add to Home Screen* with app behaviour. Everything else still works — it is just a web page.

## Caching and updates

The service worker precaches the app shell with a `Workbox` `navigateFallback` to `index.html`,
and `index.html` itself is served with whatever cache headers your host sets. Two notes:

- **Never put an immutable cache header on `index.html` or `manifest.webmanifest`.** Hashed assets
  under `assets/` can be cached forever; `index.html` must be revalidated or updates never appear.
- If you want a hard refresh after deploys, the app already shows an **Update** chip (it uses
  `registerType: 'prompt'`), so the normal path is: publish → chip appears → tap once.

To ship without an offline shell (e.g. testing a preview deployment):

```bash
SW_OFF=1 npm run build
```

## Verifying a deployment

```bash
curl -sI  https://<host>/                       # 200, and NOT immutable cache headers
curl -s   https://<host>/manifest.webmanifest   # name/icons/display:standalone
curl -sI  https://<host>/sw.js                  # 200, text/javascript
curl -sI  https://<host>/icons/maskable-icon.png # 200 — install is refused without a valid icon set
```

Then on a phone: open over HTTPS, and confirm the install affordance appears (Chrome menu →
*Install app*; Safari → Share → *Add to Home Screen*). Installed state is detected via
`display-mode: standalone`, so the in-app hint disappears by itself.
