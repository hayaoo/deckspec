import type { ReactElement, ReactNode, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  highlight?: boolean;
  style?: CSSProperties;
}

/**
 * Dark card with subtle border and rounded corners.
 */
export function Card({ children, highlight, style }: CardProps): ReactElement {
  return (
    <div
      style={{
        backgroundColor: "var(--color-card-background)",
        borderRadius: "var(--radius)",
        border: highlight
          ? "1px solid var(--color-primary)"
          : "1px solid var(--color-border)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
