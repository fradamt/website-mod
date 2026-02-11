import { build } from "esbuild";
import {
  ensureDistDir,
  loadConfig,
  prodFileName,
  renderMetadata,
  writeFileRelative,
  absoluteFromRoot
} from "./lib.mjs";

function trimTrailingSlash(input) {
  return input.replace(/\/+$/, "");
}

function resolveProdUrl(release, fileName) {
  const baseUrl = release.prodBaseUrl?.trim();
  if (!baseUrl) {
    return "";
  }

  return `${trimTrailingSlash(baseUrl)}/${fileName}`;
}

function withReleaseMetadata(scriptMeta, release, fileName) {
  const prodUrl = resolveProdUrl(release, fileName);
  if (!prodUrl) {
    return { meta: scriptMeta, prodUrl: "" };
  }

  return {
    prodUrl,
    meta: {
      ...scriptMeta,
      updateURL: scriptMeta.updateURL ?? prodUrl,
      downloadURL: scriptMeta.downloadURL ?? prodUrl
    }
  };
}

async function buildScript(script, release) {
  const entry = absoluteFromRoot(script.entry);
  const fileName = prodFileName(script.id);
  const { meta, prodUrl } = withReleaseMetadata(script.meta, release, fileName);

  const result = await build({
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    write: false,
    minify: false,
    sourcemap: false,
    legalComments: "none"
  });

  const code = result.outputFiles?.[0]?.text;

  if (!code) {
    throw new Error(`esbuild returned no output for ${script.id}`);
  }

  const userscript = `${renderMetadata(meta)}\n${code}\n`;
  await writeFileRelative(fileName, userscript);
  return { fileName, prodUrl };
}

async function main() {
  await ensureDistDir();
  const { scripts, release } = await loadConfig();

  if (scripts.length === 0) {
    throw new Error("No scripts found in userscripts.config.mjs");
  }

  const outputs = [];

  for (const script of scripts) {
    outputs.push(await buildScript(script, release));
  }

  for (const out of outputs) {
    console.log(`built dist/${out.fileName}`);
    if (out.prodUrl) {
      console.log(`prod url ${out.prodUrl}`);
    }
  }

  if (!release.prodBaseUrl) {
    console.log("note: release.prodBaseUrl is empty, so update/download metadata was not added");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
