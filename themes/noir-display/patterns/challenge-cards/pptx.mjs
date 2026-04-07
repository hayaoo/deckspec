/** challenge-cards — Header + 2-3 cards with icon and bullet items */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px } = ctx;
  const padX = px(64);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const challenges = vars.challenges ?? [];
  const n = challenges.length;
  const gap = px(16);
  const cardW = (W - 2 * padX - gap * (n - 1)) / n;
  const cardTop = contentTop + 0.1;
  const cardH = H - cardTop - px(48);

  challenges.forEach((ch, i) => {
    const cx = padX + i * (cardW + gap);
    ctx.renderCard(slide, cx, cardTop, cardW, cardH, ctx);

    let y = cardTop + px(20);

    // Icon
    const icon = ctx.resolveIcon(ch.icon);
    slide.addText(icon, {
      x: cx + px(16), y, w: 0.4, h: 0.4,
      fontSize: 20, align: "center", valign: "middle", margin: 0,
    });
    y += 0.45;

    // Title
    slide.addText(ch.title, {
      x: cx + px(16), y, w: cardW - px(32), h: 0.25,
      fontSize: 11, fontFace: FONT_H, bold: true, color: C.fg,
      margin: 0,
    });
    y += 0.35;

    // Bullet items
    (ch.items ?? []).forEach((item) => {
      slide.addText([
        { text: "• ", options: { fontSize: 9, bold: true, color: C.fg } },
        { text: item, options: { fontSize: 9, fontFace: FONT_B, color: C.fg } },
      ], {
        x: cx + px(16), y, w: cardW - px(32), h: 0.22,
        valign: "middle", margin: 0,
      });
      y += 0.24;
    });
  });
}
