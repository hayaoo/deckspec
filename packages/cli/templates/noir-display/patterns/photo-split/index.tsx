import { z } from "zod";

export const schema = z.object({
  label: z.string().min(1).max(30).optional().describe("Accent eyebrow"),
  heading: z.string().min(1).max(60).describe("Heading"),
  body: z.string().min(1).max(300).describe("Body text"),
  image: z.string().min(1).describe("Image path or URL"),
  imagePosition: z.enum(["left", "right"]).optional().describe("Image position (default: right)"),
});

export const assets = [{ field: "image", type: "image" as const }];

type Props = z.infer<typeof schema>;

export default function PhotoSplit({ label, heading, body, image, imagePosition }: Props) {
  const imgRight = imagePosition !== "left";

  const textBlock = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 56px",
        gap: 16,
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
          fontSize: 36,
          fontWeight: 600,
          lineHeight: 1.11,
          letterSpacing: "-0.009em",
        }}
      >
        {heading}
      </h2>
      <p
        style={{
          fontSize: 17,
          fontWeight: 400,
          lineHeight: 1.47,
          letterSpacing: "-0.022em",
          color: "var(--color-muted-foreground)",
        }}
      >
        {body}
      </p>
    </div>
  );

  const imageBlock = (
    <div
      style={{
        width: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e8e8ed",
      }}
    >
      <img
        src={image}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );

  return (
    <div
      className="slide"
      style={{
        display: "flex",
        background: "#ffffff",
        overflow: "hidden",
      }}
    >
      {imgRight ? (
        <>
          {textBlock}
          {imageBlock}
        </>
      ) : (
        <>
          {imageBlock}
          {textBlock}
        </>
      )}
    </div>
  );
}
