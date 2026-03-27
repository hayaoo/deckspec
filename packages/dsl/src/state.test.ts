import { describe, it, expect, beforeEach } from "vitest";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";
import { approveSlide, rejectSlide, archiveDeck, activateDeck, lockSlide } from "./state.js";

function makeDeckYaml(overrides: {
  metaState?: string;
  slideStates?: (string | undefined)[];
} = {}): string {
  const slides = (overrides.slideStates ?? [undefined, undefined]).map(
    (state, i) => ({
      file: `slides/0${i}.html`,
      ...(state ? { state } : {}),
    }),
  );

  return yaml.dump({
    meta: {
      title: "Test Deck",
      theme: "noir-display",
      state: overrides.metaState ?? "active",
    },
    slides,
  });
}

async function readDeckYaml(filePath: string): Promise<{
  meta: { state?: string };
  slides: Array<{ file?: string; state?: string; vars?: Record<string, unknown> }>;
}> {
  const content = await readFile(filePath, "utf-8");
  return yaml.load(content) as any;
}

describe("state mutations", () => {
  let tmpDir: string;
  let deckPath: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `deckspec-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tmpDir, { recursive: true });
    deckPath = join(tmpDir, "deck.yaml");
  });

  describe("approveSlide", () => {
    it("approves a generated slide", async () => {
      await writeFile(deckPath, makeDeckYaml());
      await approveSlide(deckPath, 0);
      const result = await readDeckYaml(deckPath);
      expect(result.slides[0].state).toBe("approved");
    });

    it("approves a derived slide", async () => {
      await writeFile(deckPath, makeDeckYaml({ slideStates: ["derived"] }));
      await approveSlide(deckPath, 0);
      const result = await readDeckYaml(deckPath);
      expect(result.slides[0].state).toBe("approved");
    });

    it("rejects approval of already approved slide", async () => {
      await writeFile(deckPath, makeDeckYaml({ slideStates: ["approved"] }));
      await expect(approveSlide(deckPath, 0)).rejects.toThrow("Invalid state transition");
    });

    it("rejects approval of locked slide", async () => {
      await writeFile(deckPath, makeDeckYaml({ slideStates: ["locked"] }));
      await expect(approveSlide(deckPath, 0)).rejects.toThrow("Invalid state transition");
    });

    it("throws on out-of-range index", async () => {
      await writeFile(deckPath, makeDeckYaml());
      await expect(approveSlide(deckPath, 5)).rejects.toThrow("out of range");
    });
  });

  describe("rejectSlide", () => {
    it("rejects an approved slide back to generated", async () => {
      await writeFile(deckPath, makeDeckYaml({ slideStates: ["approved"] }));
      await rejectSlide(deckPath, 0);
      const result = await readDeckYaml(deckPath);
      expect(result.slides[0].state).toBe("generated");
    });

    it("throws when rejecting a generated slide", async () => {
      await writeFile(deckPath, makeDeckYaml());
      await expect(rejectSlide(deckPath, 0)).rejects.toThrow("Only \"approved\" slides can be rejected");
    });

    it("throws when rejecting a locked slide", async () => {
      await writeFile(deckPath, makeDeckYaml({ slideStates: ["locked"] }));
      await expect(rejectSlide(deckPath, 0)).rejects.toThrow("Only \"approved\" slides can be rejected");
    });
  });

  describe("lockSlide", () => {
    it("locks an approved slide as a pattern", async () => {
      await writeFile(deckPath, makeDeckYaml({ slideStates: ["approved"] }));
      await lockSlide(deckPath, 0, "my-pattern", { title: "Hello", subtitle: "World" });
      const result = await readDeckYaml(deckPath);
      expect(result.slides[0].state).toBe("locked");
      expect(result.slides[0].file).toBe("my-pattern");
      expect(result.slides[0].vars).toEqual({ title: "Hello", subtitle: "World" });
    });

    it("throws when locking a generated slide", async () => {
      await writeFile(deckPath, makeDeckYaml());
      await expect(lockSlide(deckPath, 0, "test", {})).rejects.toThrow("Invalid state transition");
    });
  });

  describe("archiveDeck", () => {
    it("archives an active deck", async () => {
      await writeFile(deckPath, makeDeckYaml({ metaState: "active" }));
      await archiveDeck(deckPath);
      const result = await readDeckYaml(deckPath);
      expect(result.meta.state).toBe("archived");
    });

    it("throws when already archived", async () => {
      await writeFile(deckPath, makeDeckYaml({ metaState: "archived" }));
      await expect(archiveDeck(deckPath)).rejects.toThrow("already archived");
    });
  });

  describe("activateDeck", () => {
    it("activates an archived deck", async () => {
      await writeFile(deckPath, makeDeckYaml({ metaState: "archived" }));
      await activateDeck(deckPath);
      const result = await readDeckYaml(deckPath);
      expect(result.meta.state).toBe("active");
    });

    it("throws when already active", async () => {
      await writeFile(deckPath, makeDeckYaml({ metaState: "active" }));
      await expect(activateDeck(deckPath)).rejects.toThrow("already active");
    });
  });
});
