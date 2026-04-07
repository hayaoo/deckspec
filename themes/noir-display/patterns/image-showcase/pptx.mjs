/** image-showcase — Heading + large centered image + caption */
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

  const imgTop = padY + 0.55;
  const captionH = vars.caption ? 0.35 : 0;
  const imgBoxH = H - imgTop - padY - captionH;
  const imgBoxW = W - 2 * padX;

  // Image or placeholder
  if (vars.image) {
    ctx.renderImage(slide, vars.image, padX, imgTop, imgBoxW, imgBoxH, ctx);
  } else {
    // Placeholder rectangle
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: padX + imgBoxW * 0.1,
      y: imgTop + imgBoxH * 0.1,
      w: imgBoxW * 0.8,
      h: imgBoxH * 0.8,
      fill: { color: C.card },
      line: { color: C.border, width: 1, dashType: "dash" },
      rectRadius: 0.05,
    });
    slide.addText("No image", {
      x: padX, y: imgTop, w: imgBoxW, h: imgBoxH,
      fontSize: 12, fontFace: FONT_B, color: C.muted,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // Caption (optional)
  if (vars.caption) {
    slide.addText(vars.caption, {
      x: padX, y: H - padY - captionH, w: W - 2 * padX, h: captionH,
      fontSize: 9, fontFace: FONT_B, color: C.muted,
      align: "center", valign: "middle", margin: 0,
    });
  }
}
