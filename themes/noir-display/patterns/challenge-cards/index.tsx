import { z } from "zod";
import { Icon } from "../_lib/icon.js";
import { SlideHeader } from "../../components/index.js";

const challengeSchema = z.object({
  title: z.string().min(1).max(30).describe("Challenge card title"),
  icon: z.string().min(1).describe("Lucide icon name"),
  items: z.array(z.string()).min(2).max(5).describe("Bullet points"),
});

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Section heading"),
  challenges: z.array(challengeSchema).min(2).max(3).describe("Challenge cards (2-3)"),
});

type Props = z.infer<typeof schema>;

export default function ChallengeCards({ label, heading, challenges }: Props) {
  return (
    <div
      className="slide-stack"
      style={{ gap: 32, justifyContent: "center" }}
    >
      {/* Header */}
      <SlideHeader label={label} heading={heading} />

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${challenges.length}, 1fr)`,
          gap: 20,
        }}
      >
        {challenges.map((c, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "var(--color-card-background)",
              borderRadius: 18,
              padding: 0,
              boxShadow: "4px 4px 12px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Content */}
            <div style={{ padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title */}
              <span
                style={{
                  fontSize: 21,
                  fontWeight: 600,
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.022em",
                  color: "var(--color-foreground)",
                  lineHeight: 1.24,
                }}
              >
                {c.title}
              </span>
              <div style={{ color: "var(--color-muted-foreground)" }}>
                <Icon name={c.icon} size={48} />
              </div>

              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {c.items.map((item, j) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
