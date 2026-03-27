import { z } from "zod";
import { SlideHeader } from "../../components/index.js";

const nodeSchema = z.object({
  id: z.string().min(1).max(3).describe("Node ID (A, B, C)"),
  title: z.string().min(1).max(30).describe("Node title"),
});

const explanationSchema = z.object({
  id: z.string().min(1).max(3).describe("Explanation ID matching node"),
  title: z.string().min(1).max(30).describe("Explanation title"),
  items: z.array(z.string()).min(1).max(5).describe("Detail points"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Section heading"),
  center: z.string().min(1).max(40).describe("Central concept"),
  nodes: z.array(nodeSchema).min(2).max(5).describe("Surrounding nodes"),
  explanations: z.array(explanationSchema).min(2).max(5).describe("Explanations for each node"),
  footer: z.string().min(1).max(100).optional().describe("Footer message"),
});

type Props = z.infer<typeof schema>;

export default function BodyMessage({
  label,
  heading,
  center,
  nodes,
  explanations,
  footer,
}: Props) {
  // Position nodes around the center concept in a radial layout
  const nodePositions = getNodePositions(nodes.length);

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--color-card-background)",
        padding: "40px 60px",
        gap: 20,
      }}
    >
      {/* Header */}
      <SlideHeader label={label} heading={heading} />

      {/* Main content: diagram + explanations */}
      <div style={{ display: "flex", gap: 32, flex: 1, minHeight: 0 }}>
        {/* Left: diagram (60%) */}
        <div
          style={{
            width: "58%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Center concept card */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "var(--color-card-background)",
              border: "2px solid var(--color-primary)",
              borderRadius: 16,
              padding: "20px 28px",
              textAlign: "center",
              zIndex: 2,
              boxShadow: "4px 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <span
              style={{
                fontSize: 19,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.022em",
                color: "var(--color-foreground)",
                lineHeight: 1.3,
              }}
            >
              {center}
            </span>
          </div>

          {/* Surrounding node cards */}
          {nodes.map((node, i) => {
            const pos = nodePositions[i];
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: "var(--color-muted)",
                  borderRadius: 12,
                  padding: "12px 18px",
                  textAlign: "center",
                  zIndex: 1,
                  minWidth: 100,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-primary)",
                    display: "block",
                    marginBottom: 2,
                  }}
                >
                  {node.id}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "-0.016em",
                    color: "var(--color-foreground)",
                    lineHeight: 1.3,
                  }}
                >
                  {node.title}
                </span>
              </div>
            );
          })}

          {/* Connecting lines (SVG) */}
          <svg
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              overflow: "visible",
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {nodes.map((_, i) => {
              const pos = nodePositions[i];
              return (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={pos.x}
                  y2={pos.y}
                  stroke="var(--color-border)"
                  strokeWidth="0.4"
                  strokeDasharray="1,1"
                />
              );
            })}
          </svg>
        </div>

        {/* Right: explanations (40%) */}
        <div
          style={{
            width: "42%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
          }}
        >
          {explanations.map((exp, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-primary)",
                    backgroundColor: "var(--color-background)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    lineHeight: 1.4,
                  }}
                >
                  {exp.id}
                </span>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "-0.022em",
                    color: "var(--color-foreground)",
                    lineHeight: 1.3,
                  }}
                >
                  {exp.title}
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  paddingLeft: 4,
                }}
              >
                {exp.items.map((item, j) => (
                  <li
                    key={j}
                    style={{
                      fontSize: 14,
                      fontWeight: 400,
                      fontFamily: "var(--font-body)",
                      letterSpacing: "-0.016em",
                      lineHeight: 1.43,
                      color: "var(--color-muted-foreground)",
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

      {/* Footer */}
      {footer && (
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              fontFamily: "var(--font-body)",
              letterSpacing: "-0.016em",
              color: "var(--color-muted-foreground)",
              lineHeight: 1.43,
            }}
          >
            {footer}
          </span>
        </div>
      )}
    </div>
  );
}

/** Compute radial positions (%) for nodes around center (50,50) */
function getNodePositions(count: number): Array<{ x: number; y: number }> {
  const radius = 36;
  const startAngle = -Math.PI / 2; // Start from top
  return Array.from({ length: count }, (_, i) => {
    const angle = startAngle + (2 * Math.PI * i) / count;
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    };
  });
}
