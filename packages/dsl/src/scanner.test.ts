import { describe, it, expect, beforeEach } from "vitest";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";
import { scanDecks } from "./scanner.js";

function makeDeckYaml(title: string, slides: Array<{ file: string; state?: string; vars?: Record<string, unknown> }>): string {
  return yaml.dump({
    meta: { title, theme: "noir-display", state: "active" },
    slides: slides.map((s) => ({
      file: s.file,
      ...(s.state ? { state: s.state } : {}),
      ...(s.vars ? { vars: s.vars } : {}),
    })),
  });
}

describe("scanDecks", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `deckspec-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tmpDir, { recursive: true });
  });

  it("finds deck.yaml files recursively", async () => {
    const deckDir = join(tmpDir, "decks", "sample");
    await mkdir(deckDir, { recursive: true });
    await writeFile(
      join(deckDir, "deck.yaml"),
      makeDeckYaml("Sample", [
        { file: "slides/01.html" },
        { file: "slides/02.html" },
      ]),
    );

    const results = await scanDecks(tmpDir);
    expect(results).toHaveLength(1);
    expect(results[0].meta.title).toBe("Sample");
    expect(results[0].slideCount).toBe(2);
    expect(results[0].relativePath).toContain("deck.yaml");
  });

  it("returns correct approval counts", async () => {
    const deckDir = join(tmpDir, "decks", "mixed");
    await mkdir(deckDir, { recursive: true });
    await writeFile(
      join(deckDir, "deck.yaml"),
      makeDeckYaml("Mixed", [
        { file: "slides/01.html", state: "approved" },
        { file: "slides/02.html", state: "generated" },
        { file: "title-center", state: "locked", vars: { title: "Hi", subtitle: "there" } },
      ]),
    );

    const results = await scanDecks(tmpDir);
    expect(results[0].approvedCount).toBe(2); // approved + locked
    expect(results[0].slideSummaries[0].state).toBe("approved");
    expect(results[0].slideSummaries[1].state).toBe("generated");
    expect(results[0].slideSummaries[2].state).toBe("locked");
  });

  it("extracts labels from vars or file name", async () => {
    const deckDir = join(tmpDir, "decks", "labels");
    await mkdir(deckDir, { recursive: true });
    await writeFile(
      join(deckDir, "deck.yaml"),
      makeDeckYaml("Labels", [
        { file: "title-center", vars: { title: "My Title", subtitle: "Sub" } },
        { file: "slides/02-feature.html" },
      ]),
    );

    const results = await scanDecks(tmpDir);
    expect(results[0].slideSummaries[0].label).toBe("My Title");
    expect(results[0].slideSummaries[1].label).toBe("02-feature");
  });

  it("returns empty array for directory with no decks", async () => {
    const results = await scanDecks(tmpDir);
    expect(results).toHaveLength(0);
  });

  it("skips invalid YAML files gracefully", async () => {
    const deckDir = join(tmpDir, "decks", "bad");
    await mkdir(deckDir, { recursive: true });
    await writeFile(join(deckDir, "deck.yaml"), "not: valid: yaml: [[[");

    const results = await scanDecks(tmpDir);
    expect(results).toHaveLength(0);
  });
});
