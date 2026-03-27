import { z } from "zod";

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  value: z.string().min(1).max(20).describe("Massive display number"),
  unit: z.string().max(10).optional().describe("Unit after number"),
  headline: z.string().min(1).max(60).describe("Headline"),
  description: z.string().max(200).optional().describe("Body text"),
});

type Props = z.infer<typeof schema>;

export default function BigNumber({ label, value, unit, headline, description }: Props) {
  return (
    <div className="slide" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
      <div className="stack-center" style={{ gap: 20, maxWidth: 800, marginBottom: 32 }}>
        {label && (
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.022em",
              color: "var(--color-primary)",
            }}
          >
            {label}
          </span>
        )}

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 120,
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
              lineHeight: 1,
              letterSpacing: "-0.025em",
              color: "var(--color-foreground)",
            }}
          >
            {value}
          </span>
          {unit && (
            <span
              style={{
                fontSize: 40,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.009em",
                color: "var(--color-muted-foreground)",
              }}
            >
              {unit}
            </span>
          )}
        </div>

        <h3
          style={{
            fontSize: 28,
            fontWeight: 600,
            lineHeight: 1.14,
            letterSpacing: "0.007em",
          }}
        >
          {headline}
        </h3>

        {description && (
          <p
            style={{
              fontSize: 17,
              fontWeight: 400,
              lineHeight: 1.47,
              letterSpacing: "-0.022em",
              color: "var(--color-muted-foreground)",
              maxWidth: 600,
              textAlign: "center",
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
