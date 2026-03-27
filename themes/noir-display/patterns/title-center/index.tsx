import { z } from "zod";

export const schema = z.object({
  title: z.string().min(1).max(40).describe("Display headline — large, dramatic"),
  subtitle: z.string().min(1).max(80).describe("Muted subtitle beneath headline"),
});

type Props = z.infer<typeof schema>;

export default function TitleCenter({ title, subtitle }: Props) {
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
      <div className="stack-center" style={{ gap: 16, maxWidth: 900, marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 24,
            fontWeight: 400,
            lineHeight: 1.17,
            letterSpacing: "0.009em",
            color: "var(--color-muted-foreground)",
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
