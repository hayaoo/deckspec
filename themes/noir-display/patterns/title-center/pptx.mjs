/** title-center — Centered title + subtitle */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C } = ctx;

  // Title — large, centered
  slide.addText(vars.title, {
    x: 1, y: H / 2 - 0.9, w: W - 2, h: 0.8,
    fontSize: 36, fontFace: FONT_H, bold: true, color: C.fg,
    align: "center", valign: "middle", margin: 0,
  });

  // Subtitle — muted, centered below
  slide.addText(vars.subtitle, {
    x: 1.5, y: H / 2 + 0.05, w: W - 3, h: 0.5,
    fontSize: 14, fontFace: FONT_B, color: C.muted,
    align: "center", valign: "middle", margin: 0,
  });
}
