# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tampermonkey/Greasemonkey userscript development setup using TypeScript + esbuild. Supports multiple userscripts via a single config file, with a local dev server for rapid iteration and GitHub Pages deployment for production auto-updates.

## Commands

- `npm run dev` — watch + rebuild + serve `dist/` on `http://127.0.0.1:17321` with dev loader scripts
- `npm run build` — production build of standalone `.user.js` bundles into `dist/`
- `npm run check` — TypeScript type-checking (`tsc --noEmit`), no linter configured

There are no tests.

## Architecture

### Build pipeline (`scripts/`)

All build tooling is plain ESM JavaScript (`.mjs`), not TypeScript:

- **`lib.mjs`** — shared utilities: config loading, file naming conventions, userscript metadata rendering, static file serving helpers. Defines the `ScriptConfig` / `ScriptMeta` / `ReleaseConfig` types via JSDoc.
- **`build.mjs`** — production build: esbuild IIFE bundles per script, prepends `// ==UserScript==` metadata block, optionally injects `@updateURL`/`@downloadURL` from `release.prodBaseUrl`.
- **`dev.mjs`** — dev mode: esbuild watch contexts per script, generates `.dev.user.js` loader stubs (using `GM_xmlhttpRequest` to fetch from local server), runs an HTTP server from `dist/` with CORS and no-cache headers.

### Configuration (`userscripts.config.mjs`)

Single source of truth for all scripts. Each entry has `id`, `entry` (path to TS source), and `meta` (userscript metadata: name, version, match patterns, grants, etc.). Also exports `devServerHost`, `devServerPort`, and `release` settings.

### Adding a new userscript

1. Create a TypeScript file in `src/`
2. Add an entry to the `scripts` array in `userscripts.config.mjs`
3. Restart dev server

### File naming conventions (from `lib.mjs`)

- Production: `{id}.user.js`
- Dev loader: `{id}.dev.user.js`
- Dev bundle: `{id}.bundle.js`

### Deployment

GitHub Actions (`.github/workflows/deploy-userscripts.yml`) builds on push to `main` and deploys `dist/` to GitHub Pages. `USERSCRIPT_PROD_BASE_URL` is auto-set from the repo's Pages URL.

### Userscript patterns

Scripts run in the browser as content scripts. Key patterns used in the existing `imdb-letterboxd.ts`:

- DOM injection with idempotent element creation (check for existing element by ID before creating)
- `history.pushState`/`replaceState` monkey-patching + `popstate`/`hashchange` listeners for route changes
- Finite delayed reinjection bursts after navigation events instead of a global mutation loop
- Cleanup of injected UI when leaving IMDb title routes
- Graceful fallback mounting (preferred container -> slot after title -> fixed-position overlay)
