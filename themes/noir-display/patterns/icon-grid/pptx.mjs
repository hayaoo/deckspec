/** icon-grid — Header + grid of icon + title + description items */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px } = ctx;
  const padX = px(64);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const items = vars.items ?? [];
  const n = items.length;
  const cols = n <= 3 ? 3 : n === 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const gap = px(16);
  const cellW = (W - 2 * padX - gap * (cols - 1)) / cols;
  const areaH = H - contentTop - px(48);
  const cellH = (areaH - gap * (rows - 1)) / rows;

  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = padX + col * (cellW + gap);
    const cy = contentTop + row * (cellH + gap);

    let y = cy;

    // Icon
    const icon = ctx.resolveIcon(item.icon);
    slide.addText(icon, {
      x: cx, y, w: cellW, h: 0.4,
      fontSize: 22, align: "center", valign: "middle", margin: 0,
    });
    y += 0.42;

    // Title
    slide.addText(item.title, {
      x: cx, y, w: cellW, h: 0.25,
      fontSize: 10, fontFace: FONT_H, bold: true, color: C.fg,
      align: "center", margin: 0,
    });
    y += 0.28;

    // Description (optional)
    if (item.description) {
      slide.addText(item.description, {
        x: cx + px(8), y, w: cellW - px(16), h: cellH - (y - cy) - px(8),
        fontSize: 8, fontFace: FONT_B, color: C.muted,
        align: "center", valign: "top", margin: 0, lineSpacingMultiple: 1.3,
      });
    }
  });
}
