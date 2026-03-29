#!/usr/bin/env node
import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const htmlPath = resolve(args[0] ?? "output/sample.html");
const outDir = resolve(args[1] ?? "output/sample-slides");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
// Use the native slide resolution for pixel-perfect screenshots
const page = await browser.newPage({ viewport: { width: 1200, height: 675 } });
await page.goto(`file://${htmlPath}`);
await page.waitForTimeout(1000);

// Force slide to render at native 1200x675 without viewer scaling
await page.evaluate(() => {
  // Hide navigation
  const nav = document.querySelector(".nav-controls");
  if (nav) nav.style.display = "none";

  // Remove body flex centering — render slide flush at top-left
  document.body.style.display = "block";
  document.body.style.overflow = "hidden";
  document.body.style.background = "transparent";

  // Make active slide-outer fill viewport exactly at native size
  const outers = document.querySelectorAll(".slide-outer");
  outers.forEach((el) => {
    el.style.width = "1200px";
    el.style.height = "675px";
    // Remove scaling — render at 1:1
    const slide = el.querySelector(".slide, .slide-pad, .slide-stack, .slide-center, .slide-white");
    if (slide) {
      slide.style.transform = "none";
    }
  });
});

const total = await page.evaluate(() =>
  document.querySelectorAll(".slide-outer").length
);
console.log(`Found ${total} slides`);

for (let i = 0; i < total; i++) {
  if (i > 0) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
  }

  // Screenshot just the active slide-outer element for pixel-perfect capture
  const slideEl = await page.$(".slide-outer.active");
  if (slideEl) {
    const filename = `${outDir}/slide-${String(i + 1).padStart(2, "0")}.png`;
    await slideEl.screenshot({ path: filename });
    console.log(`✓ ${filename}`);
  }
}

await browser.close();
console.log(`\n✓ Saved ${total} slides to ${outDir}/`);
