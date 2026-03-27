import { z } from "zod";

const itemSchema = z.object({
  title: z.string().min(1).describe("Item title"),
  description: z.string().optional().describe("Item description"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(80).describe("Section heading"),
  items: z.array(itemSchema).min(2).max(6).describe("List items"),
});

type Props = z.infer<typeof schema>;

export default function BulletList({ label, heading, items }: Props) {
  return (
    <div
      className="slide"
      style={{
        display: "flex",
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Left: heading area */}
      <div
        style={{
          width: "40%",
          padding: "60px 48px 60px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 8,
        }}
      >
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

      {/* Right: list items */}
      <div
        style={{
          flex: 1,
          padding: "60px 80px 60px 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 16,
              padding: "14px 0",
              borderBottom:
                i < items.length - 1
                  ? "1px solid rgba(0,0,0,0.08)"
                  : "none",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                color: "var(--color-muted-foreground)",
                letterSpacing: "-0.016em",
                minWidth: 24,
                flexShrink: 0,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 19,
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "0.012em",
                  color: "var(--color-foreground)",
                  lineHeight: 1.37,
                }}
              >
                {item.title}
              </span>
              {item.description && (
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 400,
                    fontFamily: "var(--font-body)",
                    letterSpacing: "-0.022em",
                    color: "var(--color-muted-foreground)",
                    lineHeight: 1.47,
                  }}
                >
                  {item.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
