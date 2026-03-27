import { z } from "zod";

export const schema = z.object({
  headline: z.string().min(1).max(40).describe("Closing headline"),
  body: z.string().max(200).optional().describe("Closing body text"),
  cta: z.string().max(40).optional().describe("Call-to-action text (pill button)"),
  link: z.string().max(80).optional().describe("URL or contact info beneath CTA"),
});

type Props = z.infer<typeof schema>;

export default function ThankYou({ headline, body, cta, link }: Props) {
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
      <div className="stack-center" style={{ gap: 24, maxWidth: 800, marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
          }}
        >
          {headline}
        </h1>

        {body && (
          <p
            style={{
              fontSize: 21,
              fontWeight: 400,
              lineHeight: 1.38,
              letterSpacing: "0.011em",
              color: "var(--color-muted-foreground)",
              maxWidth: 600,
              textAlign: "center",
            }}
          >
            {body}
          </p>
        )}

        {cta && (
          <div style={{ marginTop: 8 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "12px 28px",
                borderRadius: 980,
                backgroundColor: "var(--color-primary)",
                color: "#fff",
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.022em",
              }}
            >
              {cta}
            </span>
          </div>
        )}

        {link && (
          <span
            style={{
              fontSize: 17,
              fontWeight: 400,
              letterSpacing: "-0.022em",
              color: "var(--color-accent)",
            }}
          >
            {link}
          </span>
        )}
      </div>
    </div>
  );
}
