/** chart-bar — Header + bar chart (manual bars, supports 2 series) */
export default function render(slide, vars, ctx) {
  const { W, H, FONT_H, FONT_B, C, px, pres } = ctx;
  const padX = px(64);

  const contentTop = ctx.renderHeader(slide, vars, ctx);

  const data = vars.data ?? [];
  const hasSeries2 = data.some((d) => d.value2 != null);
  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.value2 ?? 0)));

  // Legend (if 2 series)
  let chartTop = contentTop + 0.05;
  if (hasSeries2 && (vars.series1Name || vars.series2Name)) {
    const legendParts = [];
    if (vars.series1Name) {
      legendParts.push(
        { text: "■ ", options: { fontSize: 9, bold: true, color: C.primary } },
        { text: vars.series1Name + "  ", options: { fontSize: 9, fontFace: FONT_B, color: C.fg } },
      );
    }
    if (vars.series2Name) {
      legendParts.push(
        { text: "■ ", options: { fontSize: 9, bold: true, color: C.muted } },
        { text: vars.series2Name, options: { fontSize: 9, fontFace: FONT_B, color: C.fg } },
      );
    }
    slide.addText(legendParts, {
      x: padX, y: chartTop, w: W - 2 * padX, h: 0.25,
      align: "right", margin: 0,
    });
    chartTop += 0.3;
  }

  // Chart area
  const chartBot = H - px(48) - 0.35;
  const chartH = chartBot - chartTop;
  const chartW = W - 2 * padX - 0.5; // leave space for Y axis
  const chartX = padX + 0.5;
  const n = data.length;
  const groupGap = px(8);
  const groupW = (chartW - groupGap * (n - 1)) / n;
  const barW = hasSeries2 ? groupW * 0.42 : groupW * 0.6;

  // Grid lines (4 lines)
  for (let i = 0; i <= 4; i++) {
    const gy = chartBot - (chartH * i) / 4;
    slide.addShape(pres.shapes.LINE, {
      x: chartX, y: gy, w: chartW, h: 0,
      line: { color: C.border, width: 0.3, dashType: i === 0 ? "solid" : "dash" },
    });
    const label = Math.round((maxVal * i) / 4);
    slide.addText(String(label), {
      x: padX, y: gy - 0.1, w: 0.45, h: 0.2,
      fontSize: 7, fontFace: FONT_B, color: C.muted, align: "right", margin: 0,
    });
  }

  // Bars
  data.forEach((d, i) => {
    const gx = chartX + i * (groupW + groupGap);

    // Series 1
    const h1 = (d.value / maxVal) * chartH;
    const barX1 = hasSeries2 ? gx + (groupW - 2 * barW - px(4)) / 2 : gx + (groupW - barW) / 2;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: barX1, y: chartBot - h1, w: barW, h: h1,
      fill: { color: C.primary },
    });

    // Series 2 (optional)
    if (hasSeries2 && d.value2 != null) {
      const h2 = (d.value2 / maxVal) * chartH;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: barX1 + barW + px(4), y: chartBot - h2, w: barW, h: h2,
        fill: { color: C.muted },
      });
    }

    // X label
    slide.addText(d.label, {
      x: gx, y: chartBot + px(4), w: groupW, h: 0.25,
      fontSize: 7, fontFace: FONT_B, color: C.muted, align: "center", margin: 0,
    });
  });
}
