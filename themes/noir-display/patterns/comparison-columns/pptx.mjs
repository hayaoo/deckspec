/** comparison-columns — Heading + 2-3 comparison cards with check items */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const padX = px(64);
  const padY = px(48);

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY, w: W - 2 * padX, h: 0.4,
    fontSize: 18, fontFace: FONT_H, bold: true, color: C.fg,
    margin: 0,
  });

  const columns = vars.columns ?? [];
  const n = columns.length;
  const gap = px(16);
  const cardW = (W - 2 * padX - gap * (n - 1)) / n;
  const cardTop = padY + 0.6;
  const cardH = H - cardTop - padY;

  columns.forEach((col, i) => {
    const cx = padX + i * (cardW + gap);
    const isHighlighted = col.highlighted;

    ctx.renderCard(slide, cx, cardTop, cardW, cardH, ctx, {
      borderColor: isHighlighted ? C.primary : undefined,
      borderWidth: isHighlighted ? 1.5 : undefined,
    });

    let y = cardTop + px(16);

    // "Recommended" badge for highlighted
    if (isHighlighted) {
      slide.addText("Recommended", {
        x: cx + px(8), y, w: cardW - px(16), h: 0.2,
        fontSize: 7, fontFace: FONT_B, bold: true, color: C.primary,
        margin: 0,
      });
      y += 0.22;
    }

    // Column name
    slide.addText(col.name, {
      x: cx + px(16), y, w: cardW - px(32), h: 0.3,
      fontSize: 13, fontFace: FONT_H, bold: true, color: C.fg,
      margin: 0,
    });
    y += 0.4;

    // Separator
    slide.addShape(pres.shapes.LINE, {
      x: cx + px(16), y, w: cardW - px(32), h: 0,
      line: { color: C.border, width: 0.5 },
    });
    y += 0.15;

    // Check items
    (col.items ?? []).forEach((item) => {
      slide.addText([
        { text: "✓ ", options: { fontSize: 9, bold: true, color: C.primary } },
        { text: item, options: { fontSize: 9, fontFace: FONT_B, color: C.fg } },
      ], {
        x: cx + px(16), y, w: cardW - px(32), h: 0.25,
        valign: "middle", margin: 0,
      });
      y += 0.27;
    });
  });
}
