/** three-pillars — Header + 2-3 pillar cards */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px } = ctx;
  const padX = px(64);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const pillars = vars.pillars ?? [];
  const n = pillars.length;
  const gap = px(16);
  const cardW = (W - 2 * padX - gap * (n - 1)) / n;
  const cardTop = contentTop + 0.1;
  const cardH = H - cardTop - px(48);

  pillars.forEach((p, i) => {
    const cx = padX + i * (cardW + gap);
    ctx.renderCard(slide, cx, cardTop, cardW, cardH, ctx);

    let y = cardTop + px(20);

    // Value (optional, large)
    if (p.value) {
      slide.addText(p.value, {
        x: cx + px(16), y, w: cardW - px(32), h: 0.5,
        fontSize: 28, fontFace: FONT_H, bold: true, color: C.primary,
        align: "center", valign: "middle", margin: 0,
      });
      y += 0.55;
    }

    // Title
    slide.addText(p.title, {
      x: cx + px(16), y, w: cardW - px(32), h: 0.3,
      fontSize: 12, fontFace: FONT_H, bold: true, color: C.fg,
      align: "center", margin: 0,
    });
    y += 0.35;

    // Description
    slide.addText(p.description, {
      x: cx + px(16), y, w: cardW - px(32), h: cardH - (y - cardTop) - px(16),
      fontSize: 9, fontFace: FONT_B, color: C.muted,
      align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.4,
    });
  });
}
