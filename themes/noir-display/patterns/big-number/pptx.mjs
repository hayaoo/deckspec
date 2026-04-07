/** big-number — Massive display number + headline */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C } = ctx;
  const centerX = 1.2;
  const contentW = W - 2 * centerX;
  let y = H / 2 - 1.4;

  // Label (optional)
  if (vars.label) {
    ctx.renderLabel(slide, vars.label, ctx, {
      x: centerX, y, w: contentW, align: "center",
    });
    y += 0.3;
  }

  // Value + Unit
  const valueText = [
    { text: vars.value, options: { fontSize: 60, fontFace: FONT_H, bold: true, color: C.fg } },
  ];
  if (vars.unit) {
    valueText.push({
      text: ` ${vars.unit}`,
      options: { fontSize: 24, fontFace: FONT_H, bold: true, color: C.muted },
    });
  }
  slide.addText(valueText, {
    x: centerX, y, w: contentW, h: 1.0,
    align: "center", valign: "middle", margin: 0,
  });
  y += 1.1;

  // Headline
  slide.addText(vars.headline, {
    x: centerX, y, w: contentW, h: 0.4,
    fontSize: 16, fontFace: FONT_H, bold: true, color: C.fg,
    align: "center", valign: "middle", margin: 0,
  });
  y += 0.5;

  // Description (optional)
  if (vars.description) {
    slide.addText(vars.description, {
      x: 1.8, y, w: W - 3.6, h: 0.6,
      fontSize: 10, fontFace: FONT_B, color: C.muted,
      align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.4,
    });
  }
}
