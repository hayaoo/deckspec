/**
 * pptx-helpers.mjs — Shared PPTX rendering helpers for noir-display theme patterns.
 *
 * Each pattern's pptx.mjs receives a `ctx` object that includes these helpers.
 * ctx = { C, FONT_H, FONT_B, W, H, px, pres, resolveImage, getImageSize, containImage, ...helpers }
 */

// ─── Lucide icon name → Unicode fallback ────────────────────────────
export const ICON_MAP = {
  "file-code-2": "📄",
  "shield-check": "🛡",
  "palette": "🎨",
  "terminal": "⌨",
  "eye": "👁",
  "git-branch": "🔀",
  "user-x": "👤",
  "copy": "📋",
  "briefcase": "💼",
  "megaphone": "📢",
  "code": "⟨⟩",
  "bar-chart-2": "📊",
  "users": "👥",
  "graduation-cap": "🎓",
  "rocket": "🚀",
  "headphones": "🎧",
  "target": "🎯",
  "puzzle": "🧩",
  "heart-crack": "💔",
  "zap": "⚡",
  "shield": "🛡",
  "check": "✓",
  "x": "✕",
  "alert-triangle": "⚠",
  "star": "★",
  "arrow-right": "→",
  "arrow-left": "←",
  "chevron-right": "›",
  "clock": "🕐",
  "settings": "⚙",
  "search": "🔍",
  "lock": "🔒",
  "globe": "🌐",
  "mail": "✉",
  "phone": "📞",
  "trending-up": "📈",
  "trending-down": "📉",
  "database": "🗄",
  "cloud": "☁",
  "cpu": "🖥",
  "layers": "☰",
  "activity": "~",
  "bookmark": "🔖",
  "calendar": "📅",
  "camera": "📷",
  "download": "⬇",
  "upload": "⬆",
  "edit": "✏",
  "folder": "📁",
  "heart": "♥",
  "home": "🏠",
  "info": "ℹ",
  "link": "🔗",
  "map-pin": "📍",
  "message-circle": "💬",
  "monitor": "🖥",
  "plus": "+",
  "minus": "−",
  "refresh-cw": "↻",
  "save": "💾",
  "send": "➤",
  "share": "↗",
  "trash": "🗑",
  "wifi": "📶",
};

/**
 * Resolve a Lucide icon name to a Unicode fallback character.
 */
export function resolveIcon(name) {
  return ICON_MAP[name] ?? "●";
}

// ─── Layout helpers ─────────────────────────────────────────────────

/**
 * Render a label (eyebrow) text.
 * @param {object} slide
 * @param {string} text
 * @param {object} ctx
 * @param {object} [opts] - { x, y, w, fontSize, align }
 */
export function renderLabel(slide, text, ctx, opts = {}) {
  const padX = opts.x ?? ctx.px(64);
  const y = opts.y ?? ctx.px(48);
  slide.addText(text.toUpperCase(), {
    x: padX,
    y,
    w: opts.w ?? ctx.W - 2 * padX,
    h: 0.2,
    fontSize: opts.fontSize ?? 9,
    fontFace: ctx.FONT_B,
    bold: true,
    color: ctx.C.primary,
    charSpacing: 1.5,
    align: opts.align ?? "left",
    margin: 0,
  });
}

/**
 * Render a heading text.
 * @param {object} slide
 * @param {string} text
 * @param {object} ctx
 * @param {object} [opts] - { x, y, w, h, fontSize, align, color }
 */
export function renderHeading(slide, text, ctx, opts = {}) {
  const padX = opts.x ?? ctx.px(64);
  slide.addText(text, {
    x: padX,
    y: opts.y ?? ctx.px(48) + 0.25,
    w: opts.w ?? ctx.W - 2 * padX,
    h: opts.h ?? 0.35,
    fontSize: opts.fontSize ?? 18,
    fontFace: ctx.FONT_H,
    bold: true,
    color: opts.color ?? ctx.C.fg,
    align: opts.align ?? "left",
    margin: 0,
  });
}

/**
 * Render a standard header block (label + heading).
 * Returns the Y position below the heading for content placement.
 *
 * @param {object} slide
 * @param {object} vars - slide vars (looks for label/eyebrow + heading/headline)
 * @param {object} ctx
 * @param {object} [opts] - { padX, padY, headingSize, labelKey, headingKey, align }
 * @returns {number} contentTopY
 */
export function renderHeader(slide, vars, ctx, opts = {}) {
  const padX = opts.padX ?? ctx.px(64);
  const padY = opts.padY ?? ctx.px(48);
  const labelKey = opts.labelKey ?? "label";
  const headingKey = opts.headingKey ?? "heading";
  const labelText = vars[labelKey] ?? vars.eyebrow;
  const headingText = vars[headingKey] ?? vars.headline;
  let y = padY;

  if (labelText) {
    renderLabel(slide, labelText, ctx, { x: padX, y, w: ctx.W - 2 * padX, align: opts.align });
    y += 0.25;
  }

  renderHeading(slide, headingText, ctx, {
    x: padX,
    y,
    w: ctx.W - 2 * padX,
    fontSize: opts.headingSize ?? 18,
    align: opts.align,
  });

  return y + 0.45;
}

/**
 * Render a footnote / footer at the bottom of the slide.
 * @param {object} slide
 * @param {string} text
 * @param {object} ctx
 * @param {object} [opts] - { align, fontSize }
 */
export function renderFootnote(slide, text, ctx, opts = {}) {
  const padX = ctx.px(64);
  const padY = ctx.px(48);
  slide.addText(text, {
    x: padX,
    y: ctx.H - padY - 0.25,
    w: ctx.W - 2 * padX,
    h: 0.25,
    fontSize: opts.fontSize ?? 9,
    fontFace: ctx.FONT_B,
    color: ctx.C.muted,
    align: opts.align ?? "center",
    margin: 0,
  });
}

/**
 * Render a card background rectangle.
 * @param {object} slide
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {object} ctx
 * @param {object} [opts] - { fill, borderColor, borderWidth, rectRadius }
 */
export function renderCard(slide, x, y, w, h, ctx, opts = {}) {
  const shapeOpts = {
    x,
    y,
    w,
    h,
    fill: { color: opts.fill ?? ctx.C.card },
    rectRadius: opts.rectRadius ?? 0.05,
  };
  if (opts.borderColor) {
    shapeOpts.line = { color: opts.borderColor, width: opts.borderWidth ?? 1 };
  }
  slide.addShape(ctx.pres.shapes.ROUNDED_RECTANGLE, shapeOpts);
}

/**
 * Render an image fitted within a box, preserving aspect ratio and centered.
 * @param {object} slide
 * @param {string} filename - image path
 * @param {number} x - box x
 * @param {number} y - box y
 * @param {number} boxW - box width
 * @param {number} boxH - box height
 * @param {object} ctx
 * @returns {boolean} true if image was rendered
 */
export function renderImage(slide, filename, x, y, boxW, boxH, ctx) {
  const imgData = ctx.resolveImage(filename);
  if (!imgData) return false;

  const size = ctx.getImageSize(filename);
  if (size) {
    const fit = ctx.containImage(size.w, size.h, boxW, boxH);
    slide.addImage({ data: imgData, x: x + fit.offX, y: y + fit.offY, w: fit.w, h: fit.h });
  } else {
    slide.addImage({ data: imgData, x, y, w: boxW, h: boxH });
  }
  return true;
}
