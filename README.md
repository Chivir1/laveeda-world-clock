# Laveeda — world clock

Live time for **every city and every time zone on Earth**, built as a web app you can install on
your phone. No account, no server, no API key: open it, and it is already a world clock; hit
*Install*, and it becomes a home-screen app that keeps ticking in a plane, a tunnel, or a country
where your data does not work.

> Working prototype: the whole app is client-side. `npm run dev` → open the port, or
> `npm run build && npm run preview` for the installable production build.

---

## What it does

**Board** — your pinned clocks, each with
- a 24-hour dial (not 12): the ring is a whole day, so you see *who is in daylight* before you read a number;
- live digits, local date, weekday, and a `+1d` badge when that place is on a different calendar day;
- the gap to *your* clock (`+9h 30m`), its UTC offset and abbreviation (`IST`), and whether it is on summer time;
- a sunrise→sunset ribbon with the sun's real position, computed locally from the city's coordinates;
- a `Details` drawer: sunrise, sunset, day length, sun altitude/azimuth, the IANA zone id, the **next clock change** for that zone, other cities sharing the zone, and share/copy links.

**Compare** — the scheduling grid. One reference day across the top, one city per row, every cell
that city's *own* local hour, shaded working / awake / asleep. Click any column to scan it and the
aside reads out what each place will call that moment. Underneath is an overlap heat strip, and
beside it the **windows that actually work** — ranked runs where everyone is inside their stated
hours, with the honest answer (“no hour in this day has anyone together”) when there is none.

**All time zones** — every IANA zone the device knows (400+), grouped by the offset it holds
right now, with a live reading, abbreviation, `fixed` for the ones that never change, and a
histogram of zones per offset. Filters for *on my board*, *half-hour offsets*, *never changes*,
*±12 and beyond*. Expand a zone to see its standard vs current offset, its next transition, and
every catalogue city inside it.

**Installable** — manifest, maskable icon, service-worker cache, offline app shell, update prompt,
launch shortcuts, and per-platform instructions (iOS Safari has no install button, so the app
shows the recipe instead).

## Design choices that matter

- **No hard-coded offsets, anywhere.** Every offset, abbreviation and DST rule comes from the
  runtime's own tz database via `Intl`. When a government changes its clocks, the app is already
  right — it inherits the device's tzdata. `src/data/cities.ts` stores a *zone id* per city
  (`Asia/Kathmandu`), never `UTC+05:45`.
- **The sun is solved, not fetched.** `src/lib/sun.ts` is a ~100-line NOAA-style solar position
  model, and sunrise/sunset come from bracketing the altitude function over the local day and
  bisecting to the second. That means no weather API, it works offline, and polar day / polar
  night are handled by the solver finding no crossing rather than by a special case.
- **One heartbeat, three rates.** `src/lib/clock.ts` publishes `smooth` (rAF, throttled ~30 fps,
  for hands), `second` (digits) and `minute` (sun, zone ledger, compare grid) from a single loop
  that stops when the tab is hidden. The 400-row zone ledger ticks once a minute, so the page
  costs nothing while you read it.
- **Derived data is memoised per bucket**: zone snapshots per second, offsets per minute, daylight
  per calendar day, clock transitions per day. A 40-city board re-renders without recomputing
  trigonometry.
- **Offscreen rows are skipped with `content-visibility: auto`** instead of a virtual-list library.
- **Deep links are the API**: `?view=compare&t=9:30&tz=Asia/Tokyo&city=lagos` restores a whole
  scheduling state, which is what makes sharing a meeting time one click.
- **Your board is localStorage.** Nothing is sent anywhere; the app never makes a network request
  after first load.

## Running it

```bash
npm install
npm run dev          # vite dev server on 0.0.0.0:5173
npm run test         # 60 tests: time engine, sun solver, search, prefs, mounted UI in jsdom
npm run typecheck
npm run check        # validates the city catalogue against the runtime's tz database
npm run build && npm run preview   # production build, service worker included
```

Deploying (GitHub Actions → Pages, or any static host) is covered in
[`docs/DEPLOY.md`](docs/DEPLOY.md).

## Installing it on a phone

| Platform | How |
| --- | --- |
| Android / Chrome | Tap **Install** in the app (a real `beforeinstallprompt`), or ⋮ → *Add to Home screen* |
| iPhone / iPad | Open in **Safari** → Share → *Add to Home Screen* |
| macOS / Windows / Linux | Address-bar install icon, or ⋮ → *Install Laveeda* |

Once installed it runs standalone (full screen, `display_override: window-controls-overlay` on
desktop), boots from cache offline, and gets an **Update** chip when a new version is published.

## Keyboard

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl`+`K`, `/` | Search cities |
| `1` `2` `3` | Board · Compare · All zones |
| `←` `→` | Scan the previous / next hour in Compare |
| `T` | Light ↔ dark |
| `I` | Install sheet |
| `Esc` | Close any sheet |

## Layout

```
src/
  data/cities.ts     320 cities: zone id, coordinates, metro size, admin, a note worth reading
  data/zones.ts      generated fallback list of IANA zones (scripts/gen-zones.mjs)
  lib/time.ts        the Intl wrapper: snapshots, offsets, DST, transitions, validation
  lib/sun.ts         solar position + sunrise/sunset/twilight solver
  lib/cityState.ts   per-city derived state, memoised per minute and per day
  lib/overlap.ts     the meeting-window ranking (tested on its own)
  lib/clock.ts       three-rate heartbeat, paused when hidden
  lib/search.ts      accent-folded scored search
  lib/share.ts       deep links, clipboard, Web Share
  lib/sw.ts          service-worker → React bridge for the update prompt
  state/prefs.tsx    one reducer, one localStorage key, URL sync, defensive hydration
  components/        Hero · Board · CityCard · Dial · DayArc · CompareView · ZonesView · sheets
test/                vitest: time, sun, display, overlap, catalogue, and the app mounted in jsdom
scripts/             gen-zones.mjs (zone fallback list), validate-data.mjs (catalogue checks)
artwork/             icon-source.png — the master icon; public/icons/* are derived from it
```

## Data honesty

`npm run check` fails the build if a city references a zone the runtime rejects, an id is
duplicated or not URL-safe, a coordinate is out of range, or the fractional-offset zones
(Nepal `+5:45`, Eucla `+8:45`, Chatham `+12:45`, Newfoundland `−3:30`, Lord Howe's half-hour
shift, Myanmar `+6:30`, Afghanistan `+4:30`, Iran `+3:30`, India/Sri Lanka `+5:30`,
Adelaide/Darwin/Broken Hill `+9:30`) are missing. City notes are written so they stay true: they
describe *why* a place is interesting, not what its current offset is.

Metro sizes are approximate and used only for ranking, never displayed as fact. Coordinates are
city centres, accurate to far better than the sun maths needs.

## Privacy

No backend, no analytics, no fonts or scripts from other origins. Geolocation is optional, only
used if you press *Use my location*, and only to pick the nearest city name — it is never stored
and never leaves the device.

## Regenerating the derived files

```bash
npm run data    # rewrites src/data/zones.ts from the build machine's ICU list
npm run check   # asserts the catalogue is usable by this runtime
# Icons: public/icons/{icon-192,icon-512,maskable-icon,apple-touch-icon,favicon-32}.png all come
# from artwork/icon-source.png (`convert artwork/icon-source.png -resize 512x512 …`). The
# maskable copy is padded to the 80% safe zone; the browsers do the rest.
```

## Not done yet

Honest list for the next pass: drag-to-reorder on touch (move buttons exist, real drag is
desktop-only), time-difference *from* an arbitrary city rather than always the home clock, saved
boards (“Team A / Family”), an alarm/reminder that survives offline, a `prefers-contrast` theme,
and a `tzdata` version readout — which needs a runtime that exposes it.

## Licence

None chosen yet. If you want this to be reusable, add MIT or Apache-2.0; if it is a product, add
“all rights reserved” and skip the file.
