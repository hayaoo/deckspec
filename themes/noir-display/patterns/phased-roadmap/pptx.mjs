/** phased-roadmap — Header + chevron phase bar + detail cards */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const padX = px(64);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const phases = vars.phases ?? [];
  const n = phases.length;
  const barH = 0.35;
  const barW = W - 2 * padX;
  const phaseW = barW / n;

  // Chevron phase bar
  phases.forEach((phase, i) => {
    const phX = padX + i * phaseW;
    const isFirst = i === 0;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: phX + (isFirst ? 0 : px(2)),
      y: contentTop,
      w: phaseW - (isFirst ? 0 : px(2)),
      h: barH,
      fill: { color: isFirst ? C.primary : C.border },
    });

    slide.addText(phase.name, {
      x: phX, y: contentTop, w: phaseW, h: barH,
      fontSize: 8, fontFace: FONT_B, bold: true,
      color: isFirst ? "FFFFFF" : C.fg,
      align: "center", valign: "middle", margin: 0,
    });
  });

  // Banner (optional)
  let detailTop = contentTop + barH + 0.15;
  if (vars.banner) {
    slide.addText(vars.banner, {
      x: padX, y: detailTop, w: barW, h: 0.25,
      fontSize: 8, fontFace: FONT_B, bold: true, color: C.primary,
      align: "center", margin: 0,
    });
    detailTop += 0.3;
  }

  // Detail cards
  const gap = px(12);
  const cardW = (barW - gap * (n - 1)) / n;
  const cardH = H - detailTop - px(48);

  phases.forEach((phase, i) => {
    const cx = padX + i * (cardW + gap);
    ctx.renderCard(slide, cx, detailTop, cardW, cardH, ctx);

    let y = detailTop + px(12);

    // Phase title
    slide.addText(phase.title, {
      x: cx + px(12), y, w: cardW - px(24), h: 0.25,
      fontSize: 10, fontFace: FONT_H, bold: true, color: C.fg,
      margin: 0,
    });
    y += 0.32;

    // Items
    (phase.items ?? []).forEach((item) => {
      slide.addText([
        { text: "• ", options: { fontSize: 8, color: C.fg } },
        { text: item, options: { fontSize: 8, fontFace: FONT_B, color: C.fg } },
      ], {
        x: cx + px(12), y, w: cardW - px(24), h: 0.2,
        valign: "middle", margin: 0,
      });
      y += 0.22;
    });
  });
}
