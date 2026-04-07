/** thank-you — Closing headline + body + CTA pill + link */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const centerX = 1.2;
  const contentW = W - 2 * centerX;
  let y = H / 2 - 1.0;

  // Headline
  slide.addText(vars.headline, {
    x: centerX, y, w: contentW, h: 0.8,
    fontSize: 36, fontFace: FONT_H, bold: true, color: C.fg,
    align: "center", valign: "middle", margin: 0,
  });
  y += 0.9;

  // Body (optional)
  if (vars.body) {
    slide.addText(vars.body, {
      x: 1.8, y, w: W - 3.6, h: 0.5,
      fontSize: 12, fontFace: FONT_B, color: C.muted,
      align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.4,
    });
    y += 0.6;
  }

  // CTA pill (optional)
  if (vars.cta) {
    const pillW = 2.5;
    const pillH = 0.4;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: (W - pillW) / 2, y, w: pillW, h: pillH,
      fill: { color: C.primary }, rectRadius: 0.2,
    });
    slide.addText(vars.cta, {
      x: (W - pillW) / 2, y, w: pillW, h: pillH,
      fontSize: 10, fontFace: FONT_B, bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
    y += 0.55;
  }

  // Link (optional)
  if (vars.link) {
    slide.addText(vars.link, {
      x: centerX, y, w: contentW, h: 0.3,
      fontSize: 10, fontFace: FONT_B, color: C.primary,
      align: "center", valign: "middle", margin: 0,
    });
  }
}
