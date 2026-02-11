import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promises as fs } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

/**
 * @typedef {{
 *   name: string,
 *   namespace?: string,
 *   description?: string,
 *   version: string,
 *   match: string[],
 *   include?: string[],
 *   exclude?: string[],
 *   homepageURL?: string,
 *   supportURL?: string,
 *   updateURL?: string,
 *   downloadURL?: string,
 *   grant?: string[],
 *   connect?: string[],
 *   runAt?: string,
 *   noframes?: boolean
 * }} ScriptMeta
 */

/**
 * @typedef {{
 *   id: string,
 *   entry: string,
 *   meta: ScriptMeta
 * }} ScriptConfig
 */

/**
 * @typedef {{
 *   prodBaseUrl?: string
 * }} ReleaseConfig
 */

/**
 * @typedef {{
 *   scripts: ScriptConfig[],
 *   devServerHost: string,
 *   devServerPort: number,
 *   release: ReleaseConfig
 * }} UserscriptConfig
 */

export const DIST_DIR = path.join(projectRoot, "dist");

export function absoluteFromRoot(relativePath) {
  return path.join(projectRoot, relativePath);
}

export function bundleFileName(scriptId) {
  return `${scriptId}.bundle.js`;
}

export function prodFileName(scriptId) {
  return `${scriptId}.user.js`;
}

export function devLoaderFileName(scriptId) {
  return `${scriptId}.dev.user.js`;
}

export async function ensureDistDir() {
  await fs.mkdir(DIST_DIR, { recursive: true });
}

export async function loadConfig() {
  const configUrl = pathToFileURL(absoluteFromRoot("userscripts.config.mjs")).href;
  const loaded = await import(`${configUrl}?t=${Date.now()}`);

  return {
    scripts: loaded.scripts ?? [],
    devServerHost: loaded.devServerHost ?? "127.0.0.1",
    devServerPort: loaded.devServerPort ?? 17321,
    release: {
      prodBaseUrl: loaded.release?.prodBaseUrl ?? ""
    }
  };
}

function pushMany(lines, key, values) {
  for (const value of values ?? []) {
    lines.push(`// @${key} ${value}`);
  }
}

function pushOne(lines, key, value) {
  if (value) {
    lines.push(`// @${key} ${value}`);
  }
}

export function renderMetadata(meta) {
  const lines = ["// ==UserScript=="];
  lines.push(`// @name ${meta.name}`);
  lines.push(`// @version ${meta.version}`);

  pushOne(lines, "namespace", meta.namespace);
  pushOne(lines, "description", meta.description);

  pushMany(lines, "match", meta.match);
  pushMany(lines, "include", meta.include);
  pushMany(lines, "exclude", meta.exclude);
  pushOne(lines, "homepageURL", meta.homepageURL);
  pushOne(lines, "supportURL", meta.supportURL);
  pushOne(lines, "updateURL", meta.updateURL);
  pushOne(lines, "downloadURL", meta.downloadURL);

  if (meta.runAt) {
    lines.push(`// @run-at ${meta.runAt}`);
  }

  if (meta.noframes) {
    lines.push("// @noframes");
  }

  const grants = meta.grant && meta.grant.length > 0 ? meta.grant : ["none"];
  pushMany(lines, "grant", grants);
  pushMany(lines, "connect", meta.connect);

  lines.push("// ==/UserScript==");
  return `${lines.join("\n")}\n`;
}

export async function writeFileRelative(fileName, content) {
  await fs.writeFile(path.join(DIST_DIR, fileName), content, "utf8");
}

export function devBundleUrl(host, port, scriptId) {
  return `http://${host}:${port}/${bundleFileName(scriptId)}`;
}

export function contentType(filePath) {
  if (filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }

  if (filePath.endsWith(".map")) {
    return "application/json; charset=utf-8";
  }

  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }

  return "application/octet-stream";
}

export const paths = {
  projectRoot,
  distDir: DIST_DIR
};
