/** photo-split — 50/50 split: text + image (position configurable) */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const isRight = (vars.imagePosition ?? "right") === "right";
  const halfW = W / 2;

  // Image side — gray background
  const imgX = isRight ? halfW : 0;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: imgX, y: 0, w: halfW, h: H,
    fill: { color: C.bg },
  });

  if (vars.image) {
    const imgPad = px(24);
    ctx.renderImage(slide, vars.image, imgX + imgPad, imgPad, halfW - 2 * imgPad, H - 2 * imgPad, ctx);
  }

  // Text side
  const textX = isRight ? px(64) : halfW + px(32);
  const textW = halfW - px(64) - px(32);
  let y = H / 2 - 0.8;

  // Label (optional)
  if (vars.label) {
    ctx.renderLabel(slide, vars.label, ctx, { x: textX, y, w: textW });
    y += 0.3;
  }

  // Heading
  slide.addText(vars.heading, {
    x: textX, y, w: textW, h: 0.6,
    fontSize: 20, fontFace: FONT_H, bold: true, color: C.fg,
    valign: "top", margin: 0, lineSpacingMultiple: 1.1,
  });
  y += 0.7;

  // Body
  slide.addText(vars.body, {
    x: textX, y, w: textW, h: H - y - px(48),
    fontSize: 10, fontFace: FONT_B, color: C.muted,
    valign: "top", margin: 0, lineSpacingMultiple: 1.5,
  });
}
