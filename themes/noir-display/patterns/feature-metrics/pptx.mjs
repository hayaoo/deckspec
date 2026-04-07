/** feature-metrics — Headline + description + metric cards */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px } = ctx;
  const padX = px(64);
  const padY = px(48);

  // Headline
  let y = padY;
  slide.addText(vars.headline, {
    x: padX, y, w: W - 2 * padX, h: 0.4,
    fontSize: 18, fontFace: FONT_H, bold: true, color: C.fg,
    align: "center", margin: 0,
  });
  y += 0.5;

  // Description (optional)
  if (vars.description) {
    slide.addText(vars.description, {
      x: 1.5, y, w: W - 3, h: 0.4,
      fontSize: 10, fontFace: FONT_B, color: C.muted,
      align: "center", margin: 0, lineSpacingMultiple: 1.4,
    });
    y += 0.5;
  }

  // Metrics
  const metrics = vars.metrics ?? [];
  const n = metrics.length;
  const gap = px(16);
  const cardW = (W - 2 * padX - gap * (n - 1)) / n;
  const cardTop = y + 0.2;
  const cardH = H - cardTop - padY;

  metrics.forEach((m, i) => {
    const cx = padX + i * (cardW + gap);
    ctx.renderCard(slide, cx, cardTop, cardW, cardH, ctx);

    // Value
    slide.addText(m.value, {
      x: cx, y: cardTop + cardH * 0.2, w: cardW, h: 0.6,
      fontSize: 32, fontFace: FONT_H, bold: true, color: C.fg,
      align: "center", valign: "middle", margin: 0,
    });

    // Label
    slide.addText(m.label, {
      x: cx + px(8), y: cardTop + cardH * 0.6, w: cardW - px(16), h: 0.3,
      fontSize: 9, fontFace: FONT_B, color: C.muted,
      align: "center", valign: "top", margin: 0,
    });
  });
}
