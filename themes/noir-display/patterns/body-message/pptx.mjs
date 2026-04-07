/** body-message — Left radial diagram + right explanation list */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const padX = px(64);
  const padY = px(48);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const leftW = (W - 2 * padX) * 0.55;
  const rightX = padX + leftW + px(32);
  const rightW = W - rightX - padX;

  const nodes = vars.nodes ?? [];
  const explanations = vars.explanations ?? [];

  // ─── Left: Radial diagram ────────────────────────────────────────
  const centerX = padX + leftW / 2;
  const centerY = contentTop + (H - contentTop - padY) / 2;
  const centerR = 0.5;
  const orbitR = 1.2;

  // Center node
  ctx.renderCard(slide, centerX - centerR, centerY - centerR * 0.6, centerR * 2, centerR * 1.2, ctx, {
    borderColor: C.primary, borderWidth: 1.5,
  });
  slide.addText(vars.center, {
    x: centerX - centerR, y: centerY - centerR * 0.6, w: centerR * 2, h: centerR * 1.2,
    fontSize: 9, fontFace: FONT_H, bold: true, color: C.fg,
    align: "center", valign: "middle", margin: 0,
  });

  // Surrounding nodes
  const angleStep = (2 * Math.PI) / nodes.length;
  const startAngle = -Math.PI / 2; // start from top

  nodes.forEach((node, i) => {
    const angle = startAngle + i * angleStep;
    const nx = centerX + orbitR * Math.cos(angle);
    const ny = centerY + orbitR * Math.sin(angle) * 0.8; // compress vertically
    const nodeW = 0.8;
    const nodeH = 0.4;

    // Connection line
    slide.addShape(pres.shapes.LINE, {
      x: Math.min(centerX, nx),
      y: Math.min(centerY, ny),
      w: Math.abs(nx - centerX),
      h: Math.abs(ny - centerY),
      line: { color: C.border, width: 0.8 },
      flipH: nx < centerX,
      flipV: ny < centerY,
    });

    // Node card
    ctx.renderCard(slide, nx - nodeW / 2, ny - nodeH / 2, nodeW, nodeH, ctx);
    slide.addText(node.title, {
      x: nx - nodeW / 2, y: ny - nodeH / 2, w: nodeW, h: nodeH,
      fontSize: 7, fontFace: FONT_H, bold: true, color: C.fg,
      align: "center", valign: "middle", margin: 0,
    });
  });

  // ─── Right: Explanation list ─────────────────────────────────────
  let y = contentTop;
  const expH = (H - contentTop - padY) / Math.max(explanations.length, 1);

  explanations.forEach((exp) => {
    // ID + Title
    slide.addText([
      { text: `${exp.id}. `, options: { fontSize: 9, fontFace: FONT_H, bold: true, color: C.primary } },
      { text: exp.title, options: { fontSize: 9, fontFace: FONT_H, bold: true, color: C.fg } },
    ], {
      x: rightX, y, w: rightW, h: 0.22,
      valign: "middle", margin: 0,
    });
    y += 0.25;

    // Items
    (exp.items ?? []).forEach((item) => {
      slide.addText([
        { text: "• ", options: { fontSize: 7, color: C.fg } },
        { text: item, options: { fontSize: 7, fontFace: FONT_B, color: C.muted } },
      ], {
        x: rightX + px(8), y, w: rightW - px(8), h: 0.16,
        valign: "middle", margin: 0,
      });
      y += 0.18;
    });
    y += 0.08;
  });

  // Footer (optional)
  if (vars.footer) {
    ctx.renderFootnote(slide, vars.footer, ctx);
  }
}
