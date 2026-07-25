# inQRCode.com — Agent Guide

## Project overview

Source for [inQRCode.com](https://inqrcode.com), a small QR code / barcode
generation service. It is a **static site** (plain HTML + vanilla JS, no build
step) deployed on **Netlify**, plus **Netlify Functions** (Node.js, CommonJS)
that return real `image/png` responses so the codes can be embedded with
`<img src>`.

There is no framework, no bundler, no transpiler. Client-side code is inline
`<script>` in each HTML page using ES5-style `var` (the pages run in browsers
directly); serverless functions use Node `require`/`module.exports`.

## Repository layout

| Path | Role |
|------|------|
| `index.html` | Interactive QR page for `/{url}` (client-side QR via `qrcode.min.js`). |
| `gtin.html` | Interactive GTIN page for `/gtin/{code}` (client-side via `JsBarcode.all.min.js`). |
| `2d.html` | Interactive GS1 2D page for `/2d/{14-digit}` (client-side via `qr-code-styling.js`, logo `/gs1-logo.svg`). |
| `qrcode.min.js`, `JsBarcode.all.min.js`, `qr-code-styling.js` | Vendored client libraries — do not edit or re-minify by hand. `JsBarcode.all.min.js` and `qr-code-styling.js` are the official dist builds copied from the same versions pinned in `package.json` (`jsbarcode`, `qr-code-styling`), so the HTML pages and the functions run identical code; re-copy them from `node_modules` if those deps are upgraded. |
| `gs1-logo.svg` | GS1 logo (vector, transparent background) drawn onto GS1 2D codes. Also embedded base64 in `_lib.js` for the functions. |
| `netlify/functions/img.js` | `/img/{url}` → QR PNG (`qrcode` package, error level M). |
| `netlify/functions/gtin-img.js` | `/gtin/img/{code}` → EAN-13 (13 digits) or ITF-14 (14 digits) PNG (`jsbarcode` + `canvas`, same options as `gtin.html`). |
| `netlify/functions/2d-img.js` | `/2d/img/{14-digit}` → QR PNG at error level H with centered GS1 logo (`qr-code-styling` + `canvas` + `jsdom`, same options as `2d.html`). |
| `netlify/functions/_lib.js` | Shared helpers: URL parsing (`afterPrefix`), digit filtering, PNG/text response wrappers. The GS1 logo is embedded here as base64 (`LOGO_B64`, via `getLogoBuffer()`) so functions have no file-system dependency. `_` prefix prevents Netlify from treating it as a route. |
| `_redirects` | Netlify routing: `/img/*`, `/gtin/img/*`, `/2d/img/*` → functions; `/gtin/*` → `gtin.html`; `/2d/*` → `2d.html`; catch-all `/*` → `index.html` (all status 200 rewrites). |
| `netlify.toml` | Points the functions directory at `netlify/functions` and pins the build Node version (`NODE_VERSION = "22"`) — without the pin Netlify builds with an ancient default Node and native deps like `canvas` fail to install. The functions runtime is a separate setting: `AWS_LAMBDA_JS_RUNTIME` must be `nodejs22.x` or newer (jsdom's dependency tree contains ESM-only files; older runtimes crash with `ERR_REQUIRE_ESM`) and can only be set via the Netlify UI/CLI/API env vars, **not** `netlify.toml`. |
| `package.json` | Runtime deps only: `canvas`, `jsbarcode`, `jsdom`, `qr-code-styling`, `qrcode`. No scripts, no devDependencies. `jsdom` is pinned to exactly `26.1.0`: newer jsdom pulls ESM-only packages (`html-encoding-sniffer@6` → `@exodus/bytes`, `@asamuzakjp/css-color@4+` → `@csstools/*` v3+) that crash the CommonJS functions with `ERR_REQUIRE_ESM` on Lambda runtimes older than Node 22.12. jsdom 26's tree is all CommonJS and was verified under a simulated no-`require(esm)` runtime. Do not upgrade `jsdom` without re-running that check. |

## Routes

- `/{url}` — QR code for any URL (e.g. `inqrcode.com/https://makzan.net`).
- `/img/{url}` — QR code as PNG (function).
- `/gtin/{code}` — EAN-13 / ITF-14 interactive page; `/gtin/img/{code}` for PNG.
- `/2d/{14-digit}` — GS1 2D page linking to `https://{domain}/01/{gtin}`
  (default domain `id.gs1.org`, override with `?domain=`); `?style=rounded`
  for rounded dots (interactive page only); `/2d/img/{14-digit}` for PNG.

## Build, run, and test commands

- Install dependencies: `npm install`
- Run locally: `netlify dev` (Netlify CLI) — serves the static pages, applies
  `_redirects`, and runs the functions. There is no build step and no npm
  scripts.
- **No automated tests exist.** Verify changes manually: start `netlify dev`,
  hit the interactive pages and the `/img`, `/gtin/img`, `/2d/img` endpoints,
  and check the returned PNGs render/scan correctly.
- Deploy: push to the connected branch; Netlify publishes the repo root as
  static files and bundles `netlify/functions` (Netlify installs
  `node_modules` from `package.json` for the functions).

## Code style and conventions

- **Functions (Node, CommonJS):** `require`/`module.exports`, plain `function`
  declarations, explicit property assignment in `module.exports`, comments
  explaining *why* (e.g. why the logo is base64-embedded). Handlers validate
  input and return `lib.textResponse(400, ...)` with a usage hint on bad
  input; success paths return `lib.pngResponse(...)` (PNG responses are cached
  `max-age=86400, immutable` with CORS `*`).
- **URL parsing in functions:** always go through `lib.afterPrefix(event,
  prefix)`, which works on `event.rawUrl` so the target URL's own query string
  and percent-encoding survive the `_redirects` rewrite. Do not use
  `event.path`/`event.queryStringParameters` to reconstruct a target URL.
- **HTML pages:** single-file pages with inline `<style>` and `<script>`,
  ES5-style (`var`, no modules), minimal markup (no `<head>` scaffolding
  beyond meta/title), system font stack. Each page reads its input from
  `location.pathname`/`location.search` and re-navigates on input change.
- GTIN handling: strip non-digits/whitespace before use; ≥14 digits → ITF-14,
  otherwise EAN-13 (both client and functions use JsBarcode formats
  `ITF14`/`EAN13`).
- **HTML ↔ function parity:** `gtin.html`/`gtin-img.js` and `2d.html`/`2d-img.js`
  generate the same code with the same library and the same options, so their
  outputs match. When changing rendering options on one side, mirror the change
  on the other. Note `2d-img.js` draws the logo manually with canvas
  `drawImage` because node-canvas does not rasterize `<image>` elements nested
  in the SVG that qr-code-styling renders from.

## Security considerations

- User input flows directly into barcode content and, for `/img/{url}`, into
  an arbitrary URL string — treat it as untrusted; never inject it into HTML
  without escaping (pages use `textContent`/library rendering, keep it that
  way).
- The `?domain=` parameter on `/2d` endpoints is user-controlled and becomes
  the host of the encoded URL; this is by design (GS1 resolver domains).
- The base64 logo in `_lib.js` must stay in sync with `gs1-logo.svg` if the
  logo ever changes.
- PNG responses are publicly cacheable and CORS-open (`Access-Control-Allow-Origin: *`) — intentional, since they are meant for embedding.
