import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { resolve, dirname, join } from "node:path";
import { loadDeckFile, validateDeck, scanDecks, approveSlide, rejectSlide, archiveDeck, activateDeck } from "@deckspec/dsl";
import type { Deck, Slide } from "@deckspec/schema";
import { readdir, readFile, stat } from "node:fs/promises";
import { renderDeck, renderDashboard, renderSlide, renderThemeDetail, loadThemeCSS, loadThemeTokens, extractThemeName, resolveThemePatternsDir, resolveThemePatternsSrcDir, compileTsxCached, clearCompileCache, type DeckWithPreviews, type ThemeSummary } from "@deckspec/renderer";

let PORT = 3002;

/** SSE clients for live reload */
const sseClients = new Set<ServerResponse>();

function sendSSE(event: string, data: string = ""): void {
  for (const res of sseClients) {
    res.write(`event: ${event}\ndata: ${data}\n\n`);
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function html(res: ServerResponse, content: string): void {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(content);
}

function error(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { "Content-Type": "text/plain" });
  res.end(message);
}

async function renderDeckByPath(
  baseDir: string,
  relativePath: string,
): Promise<string> {
  const filePath = resolve(baseDir, relativePath);
  const raw = await loadDeckFile(filePath);
  const basePath = dirname(filePath);
  const themeName = extractThemeName(raw);
  const patternsDir = resolveThemePatternsDir(themeName);
  const patternsSrcDir = resolveThemePatternsSrcDir(themeName);
  const result = await validateDeck(raw, { basePath, patternsDir, patternsSrcDir, compileTsx: compileTsxCached });

  if (!result.valid) {
    const errors = result.results
      .filter((r) => !r.valid)
      .map((r) => `slides[${r.index}]: ${r.errors?.issues.map((i) => i.message).join(", ")}`)
      .join("\n");
    throw new Error(`Validation failed:\n${errors}`);
  }

  const deck = raw as Deck;
  const themeCSS = await loadThemeCSS(deck.meta.theme);
  return renderDeck(deck, themeCSS, { basePath, patternsDir, patternsSrcDir, bustCache: true });
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  baseDir: string,
): Promise<void> {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method ?? "GET";

  try {
    // SSE endpoint
    if (method === "GET" && pathname === "/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write(":\n\n");
      sseClients.add(res);
      req.on("close", () => sseClients.delete(res));
      return;
    }

    // Dashboard
    if (method === "GET" && pathname === "/") {
      const summaries = await scanDecks(baseDir);

      // Scan themes
      const themes: ThemeSummary[] = [];
      const themesDir = join(baseDir, "themes");
      try {
        const themeDirs = await readdir(themesDir);
        for (const dir of themeDirs) {
          try {
            const dirStat = await stat(join(themesDir, dir));
            if (!dirStat.isDirectory()) continue;
            const tokens = await loadThemeTokens(dir);
            const patternsSrcDir = resolveThemePatternsSrcDir(dir);
            let patternCount = 0;
            try {
              const patternEntries = await readdir(patternsSrcDir);
              patternCount = patternEntries.filter((e) => !e.startsWith("_") && !e.startsWith(".") && !e.includes(".")).length;
            } catch { /* no patterns dir */ }
            themes.push({
              name: dir,
              displayName: tokens.displayName ?? dir,
              patternCount,
              colors: [
                { name: "foreground", hex: tokens.colors?.foreground ?? "#000000" },
                { name: "primary", hex: tokens.colors?.primary ?? "#0071e3" },
                { name: "background", hex: tokens.colors?.background ?? "#ffffff" },
                { name: "card", hex: tokens.colors?.["card-background"] ?? tokens.colors?.background ?? "#ffffff" },
              ],
            });
          } catch { /* skip invalid theme */ }
        }
      } catch { /* no themes dir */ }

      // Build previews for each deck (first slide only for thumbnail)
      const decksWithPreviews: DeckWithPreviews[] = [];
      let themeCSS = "";

      for (const summary of summaries) {
        try {
          const raw = await loadDeckFile(summary.filePath);
          const deck = raw as Deck;
          const basePath = dirname(summary.filePath);
          const themeName = extractThemeName(raw);
          const patternsDir = resolveThemePatternsDir(themeName);
          const patternsSrcDir = resolveThemePatternsSrcDir(themeName);

          if (!themeCSS) {
            themeCSS = await loadThemeCSS(deck.meta.theme);
          }

          // Only render first slide for Home thumbnail
          const slidePreviews = [];
          if (deck.slides.length > 0) {
            const slide = deck.slides[0];
            let previewHtml: string;
            try {
              previewHtml = await renderSlide(slide, { basePath, patternsDir, patternsSrcDir });
            } catch {
              previewHtml = `<div style="padding:1rem;color:#999;font-size:12px">Preview unavailable</div>`;
            }
            slidePreviews.push({
              index: 0,
              state: String(slide.state ?? "generated"),
              html: previewHtml,
              file: slide.file,
            });
          }

          // Get mtime of deck.yaml
          let mtime: string | undefined;
          try {
            const fileStat = await stat(summary.filePath);
            mtime = fileStat.mtime.toISOString();
          } catch { /* ignore */ }

          decksWithPreviews.push({ summary, slidePreviews, mtime });
        } catch {
          let mtime: string | undefined;
          try {
            const fileStat = await stat(summary.filePath);
            mtime = fileStat.mtime.toISOString();
          } catch { /* ignore */ }
          decksWithPreviews.push({
            summary,
            slidePreviews: [],
            mtime,
          });
        }
      }

      const dashboardHtml = renderDashboard(decksWithPreviews, {
        mode: "interactive",
        themeCSS,
      }, themes);
      html(res, dashboardHtml);
      return;
    }

    // Theme detail: /theme/<name>
    if (method === "GET" && pathname.startsWith("/theme/")) {
      const themeName = decodeURIComponent(pathname.slice(7));
      const tokens = await loadThemeTokens(themeName);

      // Read pattern names and generate previews
      const patternsSrcDir = resolveThemePatternsSrcDir(themeName);
      const patternsDir = resolveThemePatternsDir(themeName);
      let patternInfos: { name: string; previewHtml?: string }[] = [];
      try {
        const entries = await readdir(patternsSrcDir);
        const patternNames = entries.filter((e) => !e.startsWith("_") && !e.startsWith(".") && !e.includes(".")).sort();

        for (const name of patternNames) {
          let previewHtml: string | undefined;
          try {
            // Check for examples.yaml
            const examplesPath = join(patternsSrcDir, name, "examples.yaml");
            const examplesRaw = await readFile(examplesPath, "utf-8");
            const { load } = await import("js-yaml");
            const examples = load(examplesRaw) as { name: string; vars: Record<string, unknown> }[];
            if (examples && examples.length > 0) {
              const firstExample = examples[0];
              previewHtml = await renderSlide(
                { file: name, vars: firstExample.vars } as Slide,
                { basePath: patternsSrcDir, patternsDir, patternsSrcDir },
              );
            }
          } catch { /* no examples or render failed */ }
          patternInfos.push({ name, previewHtml });
        }
      } catch { /* no patterns */ }

      // Load theme CSS for pattern previews
      let themeCSS = "";
      try {
        themeCSS = await loadThemeCSS(themeName);
      } catch { /* no theme CSS */ }

      // Read design.md description (first paragraph)
      let designDescription = "";
      try {
        const designMd = await readFile(join(baseDir, "themes", themeName, "design.md"), "utf-8");
        const lines = designMd.split("\n");
        const descLines: string[] = [];
        let pastTitle = false;
        for (const line of lines) {
          if (!pastTitle) {
            if (line.startsWith("# ")) { pastTitle = true; continue; }
            continue;
          }
          if (line.startsWith("## ")) break;
          if (line.trim() === "" && descLines.length > 0) break;
          if (line.trim() !== "") descLines.push(line.trim());
        }
        designDescription = descLines.join("\n");
      } catch { /* no design.md */ }

      const detailHtml = renderThemeDetail({ tokens, patterns: patternInfos, designDescription, themeCSS });
      html(res, detailHtml);
      return;
    }

    // Deck viewer: /deck/<name> → decks/<name>/deck.yaml
    if (method === "GET" && pathname.startsWith("/deck/")) {
      const deckName = decodeURIComponent(pathname.slice(6));
      const relativePath = `decks/${deckName}/deck.yaml`;
      const deckHtml = await renderDeckByPath(baseDir, relativePath);
      html(res, deckHtml);
      return;
    }

    // API: approve slide
    if (method === "POST" && pathname === "/api/approve") {
      const body = JSON.parse(await readBody(req));
      const filePath = resolve(baseDir, body.file);
      await approveSlide(filePath, body.slideIndex);
      sendSSE("reload");
      json(res, 200, { ok: true });
      return;
    }

    // API: reject slide
    if (method === "POST" && pathname === "/api/reject") {
      const body = JSON.parse(await readBody(req));
      const filePath = resolve(baseDir, body.file);
      await rejectSlide(filePath, body.slideIndex);
      sendSSE("reload");
      json(res, 200, { ok: true });
      return;
    }

    // API: archive deck
    if (method === "POST" && pathname === "/api/archive") {
      const body = JSON.parse(await readBody(req));
      const filePath = resolve(baseDir, body.file);
      await archiveDeck(filePath);
      sendSSE("reload");
      json(res, 200, { ok: true });
      return;
    }

    // API: activate deck
    if (method === "POST" && pathname === "/api/activate") {
      const body = JSON.parse(await readBody(req));
      const filePath = resolve(baseDir, body.file);
      await activateDeck(filePath);
      sendSSE("reload");
      json(res, 200, { ok: true });
      return;
    }

    error(res, 404, "Not found");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[dev] Error: ${message}`);
    error(res, 500, message);
  }
}

export async function devCommand(dir: string, options?: { port?: number }): Promise<void> {
  const baseDir = resolve(dir);
  if (options?.port != null) PORT = options.port;

  // Try dynamic import of chokidar for file watching
  let watcherActive = false;
  try {
    const chokidar = await import("chokidar");
    const fsWatcher = chokidar.watch(
      [
        join(baseDir, "decks/**/*.yaml"),
        join(baseDir, "decks/**/*.html"),
        join(baseDir, "decks/**/*.tsx"),
        join(baseDir, "themes/**/*"),
      ],
      {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 200 },
      },
    );
    fsWatcher.on("change", (filePath: string) => {
      console.log("[dev] File changed, reloading...");
      if (filePath.endsWith(".tsx")) {
        // Theme changes may affect shared _lib/ — clear all compiled cache
        if (filePath.includes("/themes/")) {
          clearCompileCache().catch(() => {});
        } else {
          clearCompileCache(filePath).catch(() => {});
        }
      }
      sendSSE("reload");
    });
    fsWatcher.on("add", () => {
      sendSSE("reload");
    });
    watcherActive = true;
  } catch {
    console.warn(
      "[dev] chokidar not installed — file watching disabled. Run: pnpm add -D chokidar",
    );
  }

  const server = createServer((req, res) => {
    handleRequest(req, res, baseDir).catch((err) => {
      console.error("[dev] Unhandled error:", err);
      if (!res.headersSent) {
        error(res, 500, "Internal server error");
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`\n  DeckSpec Dev Server`);
    console.log(`  Dashboard:  http://localhost:${PORT}/`);
    console.log(`  Watching:   ${baseDir}`);
    console.log(`  ${watcherActive ? "Live reload: enabled" : "Live reload: disabled (install chokidar)"}\n`);
  });
}
