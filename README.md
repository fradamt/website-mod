# website-mod userscripts

Tampermonkey/Greasemonkey userscript setup using TypeScript + esbuild, with:

- local hot-reload-style development (`npm run dev`)
- production `.user.js` builds (`npm run build`)
- GitHub Pages deployment + Tampermonkey auto-updates

## Included script

- `src/imdb-letterboxd.ts`
  - runs on IMDb title pages
  - injects a `Letterboxd` link for the current title
  - supports IMDb SPA-style navigation

## Requirements

- Node.js 20+ (22 used in CI)
- Tampermonkey (or compatible userscript manager)

## Local development

```bash
npm install
npm run dev
```

Install this loader in Tampermonkey:

- `http://127.0.0.1:17321/imdb-letterboxd.dev.user.js`

Notes:

- Keep `npm run dev` running while testing.
- Edit `src/imdb-letterboxd.ts`, then reload IMDb pages.
- The dev loader fetches `dist/imdb-letterboxd.bundle.js` on each load.

## Production install (GitHub Pages)

1. Push this repo to GitHub.
2. Enable GitHub Pages with source `GitHub Actions`.
3. Push to `main` (workflow: `.github/workflows/deploy-userscripts.yml`).
4. Install this URL once in Tampermonkey:
   - `https://<your-github-username>.github.io/<your-repo-name>/imdb-letterboxd.user.js`

After initial install, updates are automatic when:

1. code changes are pushed to `main`
2. `meta.version` is increased in `userscripts.config.mjs`

If the version does not increase, Tampermonkey will usually not replace the installed script.

## Release checklist

1. Update script code in `src/`.
2. Bump `meta.version` in `userscripts.config.mjs`.
3. Run:
   - `npm run check`
   - `npm run build`
4. Push to `main`.
5. Wait for Pages deploy to finish.
6. In Tampermonkey, verify the installed version.

## Build outputs

- `dist/<id>.user.js`: production install/update script
- `dist/<id>.dev.user.js`: dev loader script
- `dist/<id>.bundle.js`: dev bundle served by local server

## Troubleshooting

### Script does not run at all (no `alert`, no effect)

Check:

1. You installed a built userscript (`*.user.js`), not raw TypeScript from `src/`.
2. `@match` patterns include the current URL.
3. Tampermonkey script is enabled.
4. You are on an IMDb title page (`/title/tt...`), not a different IMDb route.

Relevant implementation details:

- Build target is `es2018` in both dev and prod builders for broader runtime compatibility.
- Startup/injection errors are logged with:
  - `[IMDb -> Letterboxd Shortcut] Startup failed`
  - `[IMDb -> Letterboxd Shortcut] Inject failed`

### Tampermonkey stopped pulling GitHub updates

Likely causes:

1. Script was edited manually in Tampermonkey.
2. Version did not increase.
3. Installed script is not the GitHub Pages URL.

Fix:

1. Ensure install URL is `.../imdb-letterboxd.user.js` from GitHub Pages.
2. Bump `meta.version` in `userscripts.config.mjs`.
3. Push to `main`, then run update check in Tampermonkey.
4. If needed, delete and reinstall from GitHub URL.

### IMDb becomes slow/unresponsive

This happened in earlier versions due to an aggressive page-wide `MutationObserver` feedback loop.

Current behavior (v0.2.2+):

- no global mutation observer loop
- finite retry burst on route changes (`0, 120, 350, 800, 1600ms`)
- idempotent DOM mounting (no repeated append churn)

If responsiveness regresses, first confirm installed version is `0.2.2` or newer.

## Add another userscript

1. Create a TypeScript entry in `src/`.
2. Add it to `scripts` in `userscripts.config.mjs` with:
   - `id`
   - `entry`
   - `meta` (`name`, `version`, `match`, `grant`, etc.)
3. Restart `npm run dev` after config changes.
