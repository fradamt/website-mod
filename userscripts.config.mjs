export const devServerHost = "127.0.0.1";
export const devServerPort = 17321;
export const release = {
  // GitHub Pages base URL that serves dist/*.user.js files.
  // Example: https://YOUR_GITHUB_USERNAME.github.io/website-mod
  // In GitHub Actions this is injected automatically via USERSCRIPT_PROD_BASE_URL.
  prodBaseUrl: process.env.USERSCRIPT_PROD_BASE_URL ?? ""
};

/** @type {import('./scripts/lib.mjs').ScriptConfig[]} */
export const scripts = [
  {
    id: "imdb-letterboxd",
    entry: "src/imdb-letterboxd.ts",
    meta: {
      name: "IMDb -> Letterboxd Shortcut",
      namespace: "https://website-mod.local",
      description: "Adds a one-click Letterboxd search link on IMDb title pages.",
      version: "0.1.2",
      match: [
        "https://www.imdb.com/title/*",
        "https://imdb.com/title/*",
        "https://m.imdb.com/title/*"
      ],
      runAt: "document-idle",
      grant: ["none"]
    }
  }
];
