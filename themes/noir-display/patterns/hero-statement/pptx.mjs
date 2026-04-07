/** hero-statement — Eyebrow + massive headline + body, all centered */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px } = ctx;
  const centerX = 1.2;
  const contentW = W - 2 * centerX;
  let y = H / 2 - 1.2;

  // Eyebrow
  slide.addText(vars.eyebrow, {
    x: centerX, y, w: contentW, h: 0.25,
    fontSize: 10, fontFace: FONT_B, bold: true, color: C.primary,
    align: "center", margin: 0,
  });
  y += 0.35;

  // Headline (supports \n)
  const headlineText = (vars.headline ?? "").replace(/\\n/g, "\n");
  slide.addText(headlineText, {
    x: centerX, y, w: contentW, h: 1.0,
    fontSize: 36, fontFace: FONT_H, bold: true, color: C.fg,
    align: "center", valign: "middle", margin: 0,
  });
  y += 1.1;

  // Body
  slide.addText(vars.body, {
    x: 1.8, y, w: W - 3.6, h: 0.6,
    fontSize: 12, fontFace: FONT_B, color: C.muted,
    align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.4,
  });
}
