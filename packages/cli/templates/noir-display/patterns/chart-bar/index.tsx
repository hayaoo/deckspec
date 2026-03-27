import { z } from "zod";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

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

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
        padding: "48px 80px",
        gap: 32,
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
              color: "var(--color-primary)",
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
          }}
        >
          {heading}
        </h2>
      </div>

      {/* Legend */}
      {hasSecond && (
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#0071e3" }} />
            <span style={{ fontSize: 14, color: "#6e6e73" }}>{series1Name ?? "Series 1"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: "#1d1d1f" }} />
            <span style={{ fontSize: 14, color: "#6e6e73" }}>{series2Name ?? "Series 2"}</span>
          </div>
        </div>
      )}

      {/* Chart — fixed size for SSR */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BarChart width={1020} height={380} data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 13, fill: "#6e6e73" }}
            axisLine={{ stroke: "rgba(0,0,0,0.08)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 13, fill: "#6e6e73" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Bar dataKey="value" fill="#0071e3" radius={[4, 4, 0, 0]} name={series1Name} />
          {hasSecond && (
            <Bar dataKey="value2" fill="#1d1d1f" radius={[4, 4, 0, 0]} name={series2Name} />
          )}
        </BarChart>
      </div>
    </div>
  );
}
