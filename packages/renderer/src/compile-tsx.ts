import { build } from "esbuild";
import { mkdir, rm, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

/**
 * Returns a stable cache directory under the project root so that
 * compiled modules can resolve node_modules (react, etc.) via
 * standard Node resolution.
 */
function cacheDir(): string {
  return join(process.cwd(), ".deckspec-cache");
}

/**
 * Compiles a .tsx file on-the-fly using esbuild and returns
 * the path to the compiled ESM module that can be dynamically imported.
 *
 * Uses a content-based hash for the output path so that Node.js ESM
 * import() cache is automatically busted when the source file changes.
 */
export async function compileTsx(tsxPath: string): Promise<string> {
  // Use content hash to bust Node.js ESM import() cache on file changes
  const source = await readFile(tsxPath, "utf-8");
  const hash = createHash("md5").update(source).digest("hex").slice(0, 12);
  const outDir = join(cacheDir(), hash);
  await mkdir(outDir, { recursive: true });
  const outFile = join(outDir, "index.mjs");

  await build({
    entryPoints: [tsxPath],
    outfile: outFile,
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    // Mark peer deps and heavy icon libraries as external —
    // they're resolved from project node_modules
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "lucide-react",
      "@phosphor-icons/react",
    ],
    // Allow resolving theme _lib and other deps from the source directory
    nodePaths: [
      join(process.cwd(), "node_modules"),
      dirname(dirname(tsxPath)),
    ],
    logLevel: "warning",
  });

  return outFile;
}

/** Cache: source path → compiled module path */
const compiledCache = new Map<string, string>();

/**
 * Compiles a .tsx file with caching. Returns the path to the compiled module.
 * Call `clearCompileCache()` to invalidate (e.g. on file change).
 */
export async function compileTsxCached(tsxPath: string): Promise<string> {
  const cached = compiledCache.get(tsxPath);
  if (cached) return cached;

  const compiled = await compileTsx(tsxPath);
  compiledCache.set(tsxPath, compiled);
  return compiled;
}

/**
 * Clears a specific entry or the entire compile cache.
 * Also removes the temporary compiled files.
 *
 * When clearing a specific file, the old compiled directory is removed
 * so the next compileTsx() call produces a fresh content-hashed path
 * that Node.js ESM import() treats as a new module.
 */
export async function clearCompileCache(tsxPath?: string): Promise<void> {
  if (tsxPath) {
    const cached = compiledCache.get(tsxPath);
    compiledCache.delete(tsxPath);
    if (cached) {
      try {
        await rm(dirname(cached), { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  } else {
    for (const compiled of compiledCache.values()) {
      try {
        await rm(dirname(compiled), { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
    compiledCache.clear();
    try {
      await rm(cacheDir(), { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  }
}
