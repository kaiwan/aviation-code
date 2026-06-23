# Flight Time Calculator

A small, dependency-free web app for flight planning. Enter a departure time and
an optional flight duration, and it shows when the flight completes — in the
destination's local (zone) time, in **UTC**, and in **LMT** (Local Mean Time,
the longitude-based solar time used in aviation).

**Live site:** https://kaiwan.github.io/aviation-code/

## Features

- **Departure + duration → arrival**, or just convert a single time. Duration
  accepts `hh:mm` (e.g. `2:30`) or whole minutes (e.g. `150`).
- **Airport / city lookup** — type a 3-letter IATA (`BOM`), 4-letter ICAO
  (`VABB`), or a **city name** (`Mumbai`, `London`, `New York`) to set the
  timezone. A city resolves to its prime airport (e.g. London → LHR,
  New York → JFK, Tokyo → HND). Or pick an IANA zone directly.
- **Arrival shown in zone time, UTC, and LMT.** LMT is exact when a destination
  airport is selected (uses its longitude); otherwise it is approximated from
  the zone meridian.
- **Live countdown** to departure / completion with a progress bar.
- Day-offset badge when the flight crosses midnight.

## Design / security

- 100% static, client-side only — **no backend, no third-party code, no network
  calls**, so there is no server attack surface or supply-chain dependency.
- Strict `Content-Security-Policy` (`default-src 'none'`; scripts/styles
  `'self'` only; no inline JS/CSS).
- All dynamic text is written via `textContent` (never `innerHTML`), and inputs
  are strictly validated and bounded.

## Files

| File          | Purpose                                            |
|---------------|----------------------------------------------------|
| `index.html`  | Markup + CSP                                        |
| `style.css`   | Styling                                            |
| `app.js`      | Timezone math, validation, IATA/ICAO, LMT, countdown |
| `airports.js` | Local IATA → { name, ICAO, timezone, longitude }   |

## Running locally

The strict CSP needs an `http(s)` origin (not `file://`):

```sh
python3 -m http.server 8000   # then open http://127.0.0.1:8000/
```

## Notes

The airport dataset is a curated set of major international airports. To add
more, append entries to `airports.js` (timezone must be a valid IANA zone name).
