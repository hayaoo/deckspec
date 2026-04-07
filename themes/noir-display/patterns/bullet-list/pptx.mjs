/** bullet-list — Left heading (40%) + right numbered items (60%) */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px } = ctx;
  const padX = px(64);
  const padY = px(60);
  const leftW = (W - 2 * padX) * 0.4;
  const gapX = px(48);
  const rightX = padX + leftW + gapX;
  const rightW = W - rightX - padX;

  // Left: label + heading (vertically centered)
  const leftContentH = (vars.label ? 0.3 : 0) + 0.8;
  let leftY = (H - leftContentH) / 2;
  if (vars.label) {
    ctx.renderLabel(slide, vars.label, ctx, { x: padX, y: leftY, w: leftW });
    leftY += 0.3;
  }
  slide.addText(vars.heading, {
    x: padX, y: leftY, w: leftW, h: 0.8,
    fontSize: 22, fontFace: FONT_H, bold: true, color: C.fg,
    valign: "top", margin: 0, lineSpacingMultiple: 1.1,
  });

  // Right: numbered items (vertically centered, matching left)
  const items = vars.items ?? [];
  const itemH = Math.min(0.65, (H - 2 * padY) / items.length);
  const totalItemsH = itemH * items.length;
  const startY = (H - totalItemsH) / 2;

  items.forEach((item, i) => {
    const iy = startY + i * itemH;

    // Number
    slide.addText(String(i + 1).padStart(2, "0"), {
      x: rightX, y: iy, w: 0.35, h: itemH,
      fontSize: 9, fontFace: FONT_H, bold: true, color: C.muted,
      valign: "top", margin: 0,
    });

    // Title + description
    const textParts = [
      { text: item.title, options: { fontSize: 11, fontFace: FONT_H, bold: true, color: C.fg, breakLine: true } },
    ];
    if (item.description) {
      textParts.push({
        text: item.description,
        options: { fontSize: 9, fontFace: FONT_B, color: C.muted },
      });
    }
    slide.addText(textParts, {
      x: rightX + 0.4, y: iy, w: rightW - 0.4, h: itemH,
      valign: "top", margin: 0, lineSpacingMultiple: 1.3,
    });

    // Separator line
    if (i < items.length - 1) {
      slide.addShape(ctx.pres.shapes.LINE, {
        x: rightX, y: iy + itemH, w: rightW, h: 0,
        line: { color: C.border, width: 0.5 },
      });
    }
  });
}
