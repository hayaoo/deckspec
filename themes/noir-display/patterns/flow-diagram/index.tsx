import { z } from "zod";

const stepSchema = z.object({
  title: z.string().min(1).describe("Step title"),
  description: z.string().optional().describe("Step description"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Diagram heading"),
  steps: z.array(stepSchema).min(3).max(5).describe("Flow steps"),
});

type Props = z.infer<typeof schema>;

function Arrow() {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M8 16H24M24 16L18 10M24 16L18 22"
        stroke="#0071e3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FlowDiagram({ label, heading, steps }: Props) {
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
        padding: "48px 60px",
      }}
    >
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
            fontSize: 44,
            fontWeight: 600,
            lineHeight: 1.08,
            letterSpacing: "-0.003em",
          }}
        >
          {heading}
        </h2>
      </div>

      {/* Flow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          justifyContent: "center",
        }}
      >
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Step card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 12,
                padding: "28px 20px",
                backgroundColor: "#f5f5f7",
                borderRadius: 16,
                minWidth: 160,
                maxWidth: 200,
              }}
            >
              {/* Step number */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: i === 0 ? "#0071e3" : "#1d1d1f",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                }}
              >
                {i + 1}
              </div>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.022em",
                  color: "#1d1d1f",
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </span>
              {step.description && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: "-0.016em",
                    color: "#6e6e73",
                    lineHeight: 1.38,
                  }}
                >
                  {step.description}
                </span>
              )}
            </div>

            {/* Arrow between steps */}
            {i < steps.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
    </div>
  );
}
