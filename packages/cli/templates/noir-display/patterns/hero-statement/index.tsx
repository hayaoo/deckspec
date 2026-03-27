import { z } from "zod";

export const schema = z.object({
  eyebrow: z.string().min(1).max(30).describe("Small accent label above headline"),
  headline: z.string().min(1).max(60).describe("Massive display headline (supports \\n)"),
  body: z.string().min(1).max(200).describe("Supporting body text"),
});

type Props = z.infer<typeof schema>;

export default function HeroStatement({ eyebrow, headline, body }: Props) {
  const lines = headline.split("\\n");

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
      }}
    >
      <div
        className="stack-center"
        style={{ gap: 20, maxWidth: 900, padding: "0 80px", marginBottom: 32 }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.022em",
            color: "var(--color-primary)",
          }}
        >
          {eyebrow}
        </span>

        <h1
          style={{
            fontSize: 80,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            textAlign: "center",
          }}
        >
          {lines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>

        <p
          style={{
            fontSize: 21,
            fontWeight: 400,
            lineHeight: 1.38,
            letterSpacing: "0.011em",
            color: "var(--color-muted-foreground)",
            maxWidth: 700,
            textAlign: "center",
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
