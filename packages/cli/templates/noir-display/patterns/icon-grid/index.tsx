import { z } from "zod";
import { Icon } from "../_lib/icon.js";

const itemSchema = z.object({
  icon: z.string().min(1).describe("Icon name (lucide)"),
  title: z.string().min(1).describe("Feature title"),
  description: z.string().optional().describe("Short description"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Section heading"),
  items: z.array(itemSchema).min(3).max(6).describe("Icon feature items"),
});

type Props = z.infer<typeof schema>;

export default function IconGrid({ label, heading, items }: Props) {
  const cols = items.length <= 3 ? items.length : items.length <= 4 ? 2 : 3;

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        background: "#ffffff",
        padding: "48px 80px",
      }}
    >
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 24,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 12,
              padding: "24px 16px",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#f5f5f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary)",
              }}
            >
              <Icon name={item.icon} size={24} />
            </div>
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
              {item.title}
            </span>
            {item.description && (
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: "-0.016em",
                  color: "var(--color-muted-foreground)",
                  lineHeight: 1.43,
                }}
              >
                {item.description}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
