import { createServer } from "node:http";
import path from "node:path";
import { promises as fs } from "node:fs";
import { context } from "esbuild";
import {
  absoluteFromRoot,
  bundleFileName,
  contentType,
  devBundleUrl,
  devLoaderFileName,
  ensureDistDir,
  loadConfig,
  paths,
  renderMetadata,
  writeFileRelative
} from "./lib.mjs";

function makeDevLoaderCode(host, port, scriptId) {
  const sourceUrl = devBundleUrl(host, port, scriptId);

  return `(() => {
  const url = ${JSON.stringify(sourceUrl)} + "?t=" + Date.now();

  GM_xmlhttpRequest({
    method: "GET",
    url,
    onload: (response) => {
      if (response.status >= 200 && response.status < 300) {
        (0, eval)(response.responseText);
        return;
      }

      console.error("[userscript-dev-loader] HTTP", response.status, url);
    },
    onerror: (error) => {
      console.error("[userscript-dev-loader] request failed", error);
    }
  });
})();
`;
}

function toDevMeta(script) {
  return {
    ...script.meta,
    name: `${script.meta.name} [dev-loader]`,
    version: `${script.meta.version}-dev`,
    grant: ["GM_xmlhttpRequest"],
    connect: ["127.0.0.1", "localhost"]
  };
}

async function writeDevLoader(script, host, port) {
  const meta = toDevMeta(script);
  const loader = makeDevLoaderCode(host, port, script.id);
  const out = `${renderMetadata(meta)}\n${loader}`;
  const fileName = devLoaderFileName(script.id);

  await writeFileRelative(fileName, out);
  return fileName;
}

function createStaticServer(host, port) {
  const server = createServer(async (req, res) => {
    const reqPath = new URL(req.url ?? "/", `http://${host}:${port}`).pathname;
    const safePath = reqPath === "/" ? "" : reqPath.replace(/^\//, "");

    if (!safePath) {
      const body = "userscript dev server\n";
      res.writeHead(200, {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      });
      res.end(body);
      return;
    }

    const filePath = path.join(paths.distDir, safePath);

    if (!filePath.startsWith(paths.distDir)) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("forbidden\n");
      return;
    }

    try {
      const content = await fs.readFile(filePath);

      res.writeHead(200, {
        "content-type": contentType(filePath),
        "cache-control": "no-store, no-cache, must-revalidate",
        pragma: "no-cache",
        expires: "0",
        "access-control-allow-origin": "*"
      });

      res.end(content);
    } catch {
      res.writeHead(404, {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      });
      res.end("not found\n");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(server));
  });
}

async function main() {
  await ensureDistDir();
  const { scripts, devServerHost, devServerPort } = await loadConfig();

  if (scripts.length === 0) {
    throw new Error("No scripts found in userscripts.config.mjs");
  }

  const contexts = [];

  for (const script of scripts) {
    const ctx = await context({
      entryPoints: [absoluteFromRoot(script.entry)],
      outfile: path.join(paths.distDir, bundleFileName(script.id)),
      bundle: true,
      format: "iife",
      platform: "browser",
      target: "es2018",
      sourcemap: "inline",
      legalComments: "none",
      logLevel: "info"
    });

    await ctx.watch();
    contexts.push(ctx);
  }

  for (const script of scripts) {
    const fileName = await writeDevLoader(script, devServerHost, devServerPort);
    console.log(`wrote dist/${fileName}`);
  }

  const server = await createStaticServer(devServerHost, devServerPort);

  console.log(`watching ${scripts.length} script(s)`);
  console.log(`dev server: http://${devServerHost}:${devServerPort}`);
  for (const script of scripts) {
    console.log(`install: http://${devServerHost}:${devServerPort}/${devLoaderFileName(script.id)}`);
  }

  const shutdown = async () => {
    server.close();
    for (const ctx of contexts) {
      await ctx.dispose();
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
