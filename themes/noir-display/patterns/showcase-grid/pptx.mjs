/** showcase-grid — Header + 4-column grid of category + icon + title */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px } = ctx;
  const padX = px(64);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const items = vars.items ?? [];
  const cols = 4;
  const rows = Math.ceil(items.length / cols);
  const gap = px(12);
  const cellW = (W - 2 * padX - gap * (cols - 1)) / cols;
  const areaH = H - contentTop - px(48);
  const cellH = (areaH - gap * (rows - 1)) / rows;

  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = padX + col * (cellW + gap);
    const cy = contentTop + row * (cellH + gap);

    // Category label
    slide.addText(item.category, {
      x: cx, y: cy, w: cellW, h: 0.2,
      fontSize: 7, fontFace: FONT_B, bold: true, color: C.primary,
      align: "center", margin: 0,
    });

    // Icon
    const icon = ctx.resolveIcon(item.icon);
    slide.addText(icon, {
      x: cx, y: cy + 0.22, w: cellW, h: 0.35,
      fontSize: 18, align: "center", valign: "middle", margin: 0,
    });

    // Title
    slide.addText(item.title, {
      x: cx + px(4), y: cy + 0.6, w: cellW - px(8), h: 0.3,
      fontSize: 9, fontFace: FONT_H, bold: true, color: C.fg,
      align: "center", margin: 0,
    });
  });
}
