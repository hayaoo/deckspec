import { z } from "zod";
import { SlideHeader } from "../../components/index.js";

const phaseSchema = z.object({
  name: z.string().min(1).max(15).describe("Phase label e.g. Phase1"),
  title: z.string().min(1).max(30).describe("Phase title"),
  items: z.array(z.string()).min(2).max(5).describe("Phase action items"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Section heading"),
  banner: z.string().min(1).max(60).optional().describe("Cross-phase goal text"),
  phases: z.array(phaseSchema).min(2).max(4).describe("Roadmap phases (2-4)"),
});

type Props = z.infer<typeof schema>;

export default function PhasedRoadmap({ label, heading, banner, phases }: Props) {
  const count = phases.length;

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--color-card-background)",
        padding: "48px 60px",
        gap: 24,
      }}
    >
      {/* Header */}
      <SlideHeader label={label} heading={heading} />

      {/* Phase chevrons */}
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        {phases.map((phase, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              position: "relative",
              backgroundColor: i === 0 ? "var(--color-primary)" : "var(--color-muted)",
              clipPath:
                i < count - 1
                  ? "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)"
                  : "polygon(0 0, 100% 0, 100% 100%, 0 100%, 16px 50%)",
              padding: i === 0 ? "14px 24px 14px 16px" : "14px 24px 14px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
              minHeight: 56,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                letterSpacing: "0.04em",
                textTransform: "uppercase" as const,
                color: i === 0 ? "#ffffff" : "var(--color-primary)",
                lineHeight: 1,
              }}
            >
              {phase.name}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.022em",
                color: i === 0 ? "#ffffff" : "var(--color-foreground)",
                lineHeight: 1.2,
              }}
            >
              {phase.title}
            </span>
          </div>
        ))}
      </div>

      {/* Banner */}
      {banner && (
        <div
          style={{
            backgroundColor: "var(--color-muted)",
            borderRadius: 8,
            padding: "10px 24px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
              letterSpacing: "-0.016em",
              color: "var(--color-foreground)",
            }}
          >
            {banner}
          </span>
        </div>
      )}

      {/* Detail cards */}
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        {phases.map((phase, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: "var(--color-background)",
              borderRadius: 12,
              padding: "20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.016em",
                color: "var(--color-primary)",
              }}
            >
              {phase.name}
            </span>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {phase.items.map((item, j) => (
                <li
                  key={j}
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    fontFamily: "var(--font-body)",
                    letterSpacing: "-0.016em",
                    lineHeight: 1.43,
                    color: "var(--color-foreground)",
                    paddingLeft: 14,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    &#x2022;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
