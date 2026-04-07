/** pricing-tiers — Heading + 2-3 pricing plan cards */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const padX = px(64);
  const padY = px(48);

  // Heading
  slide.addText(vars.heading, {
    x: padX, y: padY, w: W - 2 * padX, h: 0.4,
    fontSize: 18, fontFace: FONT_H, bold: true, color: C.fg,
    align: "center", margin: 0,
  });

  const plans = vars.plans ?? [];
  const n = plans.length;
  const gap = px(16);
  const cardW = (W - 2 * padX - gap * (n - 1)) / n;
  const cardTop = padY + 0.6;
  const cardH = H - cardTop - padY;

  plans.forEach((plan, i) => {
    const cx = padX + i * (cardW + gap);
    const isHighlighted = plan.highlighted;

    ctx.renderCard(slide, cx, cardTop, cardW, cardH, ctx, {
      borderColor: isHighlighted ? C.primary : undefined,
      borderWidth: isHighlighted ? 1.5 : undefined,
    });

    let y = cardTop + px(20);

    // Plan name
    slide.addText(plan.name, {
      x: cx + px(16), y, w: cardW - px(32), h: 0.25,
      fontSize: 10, fontFace: FONT_B, bold: true, color: C.muted,
      margin: 0,
    });
    y += 0.3;

    // Price
    slide.addText(plan.price, {
      x: cx + px(16), y, w: cardW - px(32), h: 0.4,
      fontSize: 24, fontFace: FONT_H, bold: true, color: C.fg,
      margin: 0,
    });
    y += 0.45;

    // Description (optional)
    if (plan.description) {
      slide.addText(plan.description, {
        x: cx + px(16), y, w: cardW - px(32), h: 0.3,
        fontSize: 8, fontFace: FONT_B, color: C.muted,
        margin: 0, lineSpacingMultiple: 1.3,
      });
      y += 0.35;
    }

    // Separator
    slide.addShape(pres.shapes.LINE, {
      x: cx + px(16), y, w: cardW - px(32), h: 0,
      line: { color: C.border, width: 0.5 },
    });
    y += 0.15;

    // Features
    (plan.features ?? []).forEach((feat) => {
      slide.addText([
        { text: "✓ ", options: { fontSize: 9, bold: true, color: C.primary } },
        { text: feat, options: { fontSize: 9, fontFace: FONT_B, color: C.fg } },
      ], {
        x: cx + px(16), y, w: cardW - px(32), h: 0.22,
        valign: "middle", margin: 0,
      });
      y += 0.24;
    });
  });
}
