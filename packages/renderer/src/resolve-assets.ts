import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface AssetFieldSpec {
  field: string;
  type: "svg" | "image";
}

export async function resolveAssets(
  vars: Record<string, unknown>,
  assets: AssetFieldSpec[],
  basePath: string,
): Promise<Record<string, unknown>> {
  const resolved = { ...vars };
  for (const spec of assets) {
    const rawPath = resolved[spec.field];
    if (typeof rawPath !== "string") continue;

    if (spec.type === "svg") {
      const fullPath = resolve(basePath, rawPath);
      const content = await readFile(fullPath, "utf-8");
      resolved[spec.field] = sanitizeSvg(content);
    } else if (spec.type === "image") {
      if (rawPath.startsWith("https://")) {
        // External URL: keep as-is
        resolved[spec.field] = rawPath;
      } else {
        // Local file: base64 encode
        const fullPath = resolve(basePath, rawPath);
        const buffer = await readFile(fullPath);
        const ext = rawPath.split(".").pop()?.toLowerCase() ?? "png";
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
          svg: "image/svg+xml",
        };
        const mime = mimeMap[ext] ?? "application/octet-stream";
        resolved[spec.field] = `data:${mime};base64,${buffer.toString("base64")}`;
      }
    }
  }
  return resolved;
}

/**
 * Remove <script> tags and event handler attributes from SVG content.
 */
export function sanitizeSvg(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, "");
}
