import { z } from "zod";

const columnSchema = z.object({
  name: z.string().min(1).describe("Column header"),
  items: z.array(z.string().min(1)).min(1).max(6).describe("Feature items"),
  highlighted: z.boolean().optional().describe("Highlight this column"),
});

export const schema = z.object({
  heading: z.string().min(1).max(60).describe("Section heading"),
  columns: z.array(columnSchema).min(2).max(3).describe("Comparison columns"),
});

type Props = z.infer<typeof schema>;

export default function ComparisonColumns({ heading, columns }: Props) {
  return (
    <div className="slide-stack" style={{ justifyContent: "center", gap: 44 }}>
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
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          gap: 20,
        }}
      >
        {columns.map((col, ci) => (
          <div
            key={ci}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 18,
              border: col.highlighted
                ? "1.5px solid var(--color-primary)"
                : "none",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              boxShadow: col.highlighted
                ? "0 2px 12px rgba(0,113,227,0.08)"
                : "4px 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "0.009em",
                  color: "var(--color-foreground)",
                }}
              >
                {col.name}
              </span>
              {col.highlighted && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 980,
                    backgroundColor: "var(--color-primary)",
                    color: "#fff",
                  }}
                >
                  Recommended
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {col.items.map((item, ii) => (
                <div key={ii} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path
                      d="M3 8.5L6.5 12L13 4"
                      stroke={col.highlighted ? "var(--color-primary)" : "var(--color-muted-foreground)"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 400,
                      letterSpacing: "-0.022em",
                      color: "var(--color-foreground)",
                      lineHeight: 1.47,
                    }}
                  >
                    {item}
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
