import { z } from "zod";
import { Icon } from "../_lib/icon.js";
import { SlideHeader } from "../../components/index.js";

const itemSchema = z.object({
  category: z.string().min(1).max(15).describe("Category label"),
  icon: z.string().min(1).describe("Lucide icon name"),
  title: z.string().min(1).max(40).describe("Item title"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Section heading"),
  items: z.array(itemSchema).min(4).max(8).describe("Grid items (4-8)"),
});

type Props = z.infer<typeof schema>;

export default function ShowcaseGrid({ label, heading, items }: Props) {
  const cols = items.length <= 4 ? items.length : 4;

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 40,
        background: "var(--color-card-background)",
        padding: "48px 80px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <SlideHeader label={label} heading={heading} />
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 24,
          width: "100%",
          maxWidth: 1040,
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
              gap: 10,
              padding: "20px 12px",
            }}
          >
            {/* Category label */}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.016em",
                color: "var(--color-primary)",
                lineHeight: 1,
              }}
            >
              {item.category}
            </span>

            {/* Icon */}
            <div style={{ color: "var(--color-foreground)" }}>
              <Icon name={item.icon} size={40} />
            </div>

            {/* Title */}
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
          </div>
        ))}
      </div>
    </div>
  );
}
