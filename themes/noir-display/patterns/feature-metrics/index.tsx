import { z } from "zod";

const metricSchema = z.object({
  label: z.string().min(1).describe("Metric label"),
  value: z.string().min(1).describe("Display value"),
});

export const schema = z.object({
  headline: z.string().min(1).max(60).describe("Section heading"),
  description: z.string().max(200).optional().describe("Optional body text"),
  metrics: z.array(metricSchema).min(2).max(4).describe("Key metrics"),
});

type Props = z.infer<typeof schema>;

export default function FeatureMetrics({ headline, description, metrics }: Props) {
  return (
    <div
      className="slide"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        background: "#ffffff",
        padding: "40px 80px 60px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.003em",
          }}
        >
          {headline}
        </h2>
        {description && (
          <p
            style={{
              fontSize: 21,
              fontWeight: 400,
              lineHeight: 1.38,
              color: "var(--color-muted-foreground)",
              marginTop: 12,
            }}
          >
            {description}
          </p>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 64 }}>
        {metrics.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                lineHeight: 1,
                letterSpacing: "-0.015em",
                color: "var(--color-foreground)",
              }}
            >
              {m.value}
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 400,
                letterSpacing: "-0.022em",
                color: "var(--color-muted-foreground)",
              }}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
