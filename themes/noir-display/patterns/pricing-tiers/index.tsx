import { z } from "zod";

const planSchema = z.object({
  name: z.string().min(1).describe("Plan name"),
  price: z.string().min(1).describe("Price display"),
  description: z.string().optional().describe("Plan description"),
  features: z.array(z.string().min(1)).min(1).max(6).describe("Feature list"),
  highlighted: z.boolean().optional().describe("Highlight this plan"),
});

export const schema = z.object({
  heading: z.string().min(1).max(60).describe("Section heading"),
  plans: z.array(planSchema).min(2).max(3).describe("Pricing plans"),
});

type Props = z.infer<typeof schema>;

export default function PricingTiers({ heading, plans }: Props) {
  return (
    <div className="slide-stack" style={{ justifyContent: "center", gap: 40 }}>
      <h2
        style={{
          fontSize: 48,
          fontWeight: 600,
          lineHeight: 1.08,
          letterSpacing: "-0.003em",
          textAlign: "center",
        }}
      >
        {heading}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${plans.length}, 1fr)`,
          gap: 20,
        }}
      >
        {plans.map((plan, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 18,
              border: plan.highlighted ? "1.5px solid var(--color-primary)" : "none",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              boxShadow: plan.highlighted
                ? "0 2px 12px rgba(0,113,227,0.08)"
                : "4px 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.016em",
                color: plan.highlighted ? "var(--color-primary)" : "var(--color-muted-foreground)",
              }}
            >
              {plan.name}
            </span>

            <span
              style={{
                fontSize: 40,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                lineHeight: 1,
                letterSpacing: "-0.009em",
                color: "var(--color-foreground)",
              }}
            >
              {plan.price}
            </span>

            {plan.description && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: "-0.016em",
                  color: "var(--color-muted-foreground)",
                  lineHeight: 1.43,
                }}
              >
                {plan.description}
              </span>
            )}

            <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {plan.features.map((feat, fi) => (
                <div key={fi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={14} height={14} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M3 8.5L6.5 12L13 4"
                      stroke={plan.highlighted ? "var(--color-primary)" : "var(--color-muted-foreground)"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      letterSpacing: "-0.016em",
                      color: "var(--color-foreground)",
                      lineHeight: 1.43,
                    }}
                  >
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
