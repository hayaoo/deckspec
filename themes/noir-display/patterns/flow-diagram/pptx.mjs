/** flow-diagram — Header + step cards connected by arrows */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const padX = px(64);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const steps = vars.steps ?? [];
  const n = steps.length;
  const gap = px(32);
  const arrowW = 0.25;
  const totalArrowW = arrowW * (n - 1);
  const totalGap = gap * (n - 1);
  const cardW = (W - 2 * padX - totalGap) / n;
  const cardTop = contentTop + 0.15;
  const cardH = H - cardTop - px(48);

  steps.forEach((step, i) => {
    const cx = padX + i * (cardW + gap);
    ctx.renderCard(slide, cx, cardTop, cardW, cardH, ctx);

    let y = cardTop + px(16);

    // Step number circle
    const circR = 0.18;
    const circX = cx + cardW / 2;
    const circY = y + circR;
    slide.addShape(pres.shapes.OVAL, {
      x: circX - circR, y: y, w: circR * 2, h: circR * 2,
      fill: { color: C.primary },
    });
    slide.addText(String(i + 1), {
      x: circX - circR, y: y, w: circR * 2, h: circR * 2,
      fontSize: 10, fontFace: FONT_H, bold: true, color: "FFFFFF",
      align: "center", valign: "middle", margin: 0,
    });
    y += circR * 2 + px(12);

    // Title
    slide.addText(step.title, {
      x: cx + px(12), y, w: cardW - px(24), h: 0.3,
      fontSize: 10, fontFace: FONT_H, bold: true, color: C.fg,
      align: "center", margin: 0,
    });
    y += 0.35;

    // Description (optional)
    if (step.description) {
      slide.addText(step.description, {
        x: cx + px(12), y, w: cardW - px(24), h: cardH - (y - cardTop) - px(12),
        fontSize: 8, fontFace: FONT_B, color: C.muted,
        align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.3,
      });
    }

    // Arrow between cards
    if (i < n - 1) {
      const arrowX = cx + cardW + (gap - arrowW) / 2;
      const arrowY = cardTop + cardH / 2;
      slide.addText("→", {
        x: arrowX, y: arrowY - 0.15, w: arrowW, h: 0.3,
        fontSize: 16, color: C.muted, align: "center", valign: "middle", margin: 0,
      });
    }
  });
}
