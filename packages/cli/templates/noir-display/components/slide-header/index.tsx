import type { ReactElement } from "react";

interface SlideHeaderProps {
  label?: string;
  heading: string;
  headingSize?: number;
}

/**
 * Minimal slide header — optional muted label + display heading.
 * Apple-style: label is small muted text, heading is large semibold.
 */
export function SlideHeader({
  label,
  heading,
  headingSize = 40,
}: SlideHeaderProps): ReactElement {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && (
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.016em",
            color: "var(--color-accent)",
          }}
        >
          {label}
        </span>
      )}
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: headingSize,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: headingSize >= 48 ? "-0.015em" : "-0.009em",
          color: "var(--color-foreground)",
          margin: 0,
        }}
      >
        {heading}
      </h2>
    </div>
  );
}
