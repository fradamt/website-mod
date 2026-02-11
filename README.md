# userscript-dev-starter

A Tampermonkey/Greasemonkey TypeScript setup with a fast local development loop and a GitHub-hosted production update path.

## What this gives you

- TypeScript source files in `src/`
- Config-driven multi-script setup via `userscripts.config.mjs`
- `npm run dev`:
  - watches + rebuilds bundles
  - serves `dist/` on `http://127.0.0.1:17321`
  - generates `.dev.user.js` loader scripts for Tampermonkey
- `npm run build`:
  - generates standalone production `.user.js` bundles in `dist/`
  - injects `@updateURL` / `@downloadURL` when `release.prodBaseUrl` is set
- GitHub Actions workflow to deploy `dist/` to GitHub Pages on push to `main`

## Quick start (dev loop)

```bash
npm install
npm run dev
```

Then open and install:

- `http://127.0.0.1:17321/imdb-letterboxd.dev.user.js`

After install, edit `src/imdb-letterboxd.ts` and reload IMDb pages to see changes.

## Production auto-updates via GitHub

You only do the Tampermonkey install once. Later updates are automatic.

1. Push this repo to GitHub.
2. Ensure GitHub Pages is enabled with source `GitHub Actions`.
3. Push to `main`.
4. Wait for workflow `.github/workflows/deploy-userscripts.yml` to finish.
5. Install this URL once in Tampermonkey:
   - `https://<your-github-username>.github.io/<your-repo-name>/imdb-letterboxd.user.js`

After that:

- Edit code in `src/`
- Bump `meta.version` in `userscripts.config.mjs`
- Push to `main`
- GitHub rebuilds + redeploys
- Tampermonkey sees the higher version and updates from the same URL

No local `npm run dev` process is required for production usage.

## Build locally for production

```bash
npm run build
```

If `release.prodBaseUrl` is set (or `USERSCRIPT_PROD_BASE_URL` is provided), generated scripts include update metadata.

## Add a new userscript

1. Create a new TypeScript entry in `src/`.
2. Add an entry in `userscripts.config.mjs` with:
   - `id`
   - `entry`
   - metadata (`name`, `version`, `match`, etc.)
3. Restart `npm run dev` if you changed config.

## Included example

- `src/imdb-letterboxd.ts`: adds a `Letterboxd` shortcut link on IMDb title pages.
