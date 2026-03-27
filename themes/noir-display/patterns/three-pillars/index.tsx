import { z } from "zod";

const pillarSchema = z.object({
  title: z.string().min(1).describe("Pillar title"),
  description: z.string().min(1).describe("Pillar description"),
  value: z.string().optional().describe("Optional large display value"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Section heading"),
  pillars: z.array(pillarSchema).min(2).max(3).describe("Pillars (2-3)"),
});

type Props = z.infer<typeof schema>;

export default function ThreePillars({ label, heading, pillars }: Props) {
  return (
    <div className="slide-stack" style={{ justifyContent: "center", gap: 48 }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
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
            fontSize: 48,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.003em",
          }}
        >
          {heading}
        </h2>
      </div>

      {/* Pillars as white cards on gray canvas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${pillars.length}, 1fr)`,
          gap: 20,
        }}
      >
        {pillars.map((p, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 18,
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "4px 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            {p.value && (
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  lineHeight: 1,
                  letterSpacing: "-0.009em",
                  color: "var(--color-primary)",
                }}
              >
                {p.value}
              </span>
            )}
            <span
              style={{
                fontSize: 21,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                letterSpacing: "0.011em",
                color: "var(--color-foreground)",
                lineHeight: 1.24,
              }}
            >
              {p.title}
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 400,
                fontFamily: "var(--font-body)",
                letterSpacing: "-0.022em",
                color: "var(--color-muted-foreground)",
                lineHeight: 1.47,
              }}
            >
              {p.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
