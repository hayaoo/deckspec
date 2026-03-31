import { z } from "zod";
import React from "react";

const dataSchema = z.object({
  label: z.string().min(1).describe("Category label"),
  value: z.number().describe("Bar value"),
  value2: z.number().optional().describe("Second bar value"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Chart heading"),
  data: z.array(dataSchema).min(2).max(8).describe("Bar data"),
  series1Name: z.string().optional().describe("First series name"),
  series2Name: z.string().optional().describe("Second series name"),
});

type Props = z.infer<typeof schema>;

export default function ChartBarPattern({ label, heading, data, series1Name, series2Name }: Props) {
  const hasSecond = data.some((d) => d.value2 !== undefined);
  const allValues = data.flatMap((d) => d.value2 !== undefined ? [d.value, d.value2] : [d.value]);
  const maxValue = Math.max(...allValues, 1);

  // Generate nice Y-axis ticks
  const tickCount = 5;
  const rawStep = maxValue / (tickCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  const yMax = step * (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) => step * (tickCount - 1 - i));

  const barHeight = 380;

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--color-card-background, #ffffff)",
        padding: "48px 80px",
        gap: 24,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div>
        {label && (
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.022em",
              color: "var(--color-primary, #0071e3)",
              display: "block",
              marginBottom: 8,
            }}
          >
            {label}
          </span>
        )}
        <h2
          style={{
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.009em",
            color: "var(--color-foreground, #1d1d1f)",
          }}
        >
          {heading}
        </h2>
      </div>

      {/* Legend */}
      {hasSecond && (
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "var(--color-primary, #0071e3)" }} />
            <span style={{ fontSize: 14, color: "var(--color-muted-foreground, #6e6e73)" }}>{series1Name ?? "Series 1"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "var(--color-foreground, #1d1d1f)" }} />
            <span style={{ fontSize: 14, color: "var(--color-muted-foreground, #6e6e73)" }}>{series2Name ?? "Series 2"}</span>
          </div>
        </div>
      )}

      {/* Chart area */}
      <div style={{ flex: 1, display: "flex", gap: 0 }}>
        {/* Y-axis labels */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: barHeight,
            paddingRight: 12,
            flexShrink: 0,
          }}
        >
          {ticks.map((tick, i) => (
            <span
              key={i}
              style={{
                fontSize: 13,
                color: "var(--color-muted-foreground, #6e6e73)",
                textAlign: "right",
                minWidth: 40,
                lineHeight: "1",
              }}
            >
              {tick.toLocaleString()}
            </span>
          ))}
        </div>

        {/* Bars area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            height: barHeight,
          }}
        >
          {/* Grid lines */}
          {ticks.map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${(i / (tickCount - 1)) * 100}%`,
                left: 0,
                right: 0,
                borderTop: "1px dashed rgba(0,0,0,0.08)",
              }}
            />
          ))}

          {/* Bar groups */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              height: "100%",
              position: "relative",
              zIndex: 1,
            }}
          >
            {data.map((d, i) => {
              const h1 = (d.value / yMax) * 100;
              const h2 = d.value2 !== undefined ? (d.value2 / yMax) * 100 : 0;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: hasSecond ? 4 : 0, height: barHeight - 28 }}>
                    <div
                      style={{
                        width: hasSecond ? 28 : 40,
                        height: `${h1}%`,
                        backgroundColor: "var(--color-primary, #0071e3)",
                        borderRadius: "4px 4px 0 0",
                        minHeight: d.value > 0 ? 2 : 0,
                      }}
                    />
                    {hasSecond && d.value2 !== undefined && (
                      <div
                        style={{
                          width: 28,
                          height: `${h2}%`,
                          backgroundColor: "var(--color-foreground, #1d1d1f)",
                          borderRadius: "4px 4px 0 0",
                          minHeight: d.value2 > 0 ? 2 : 0,
                        }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--color-muted-foreground, #6e6e73)",
                      marginTop: 8,
                      textAlign: "center",
                      lineHeight: "1",
                    }}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
