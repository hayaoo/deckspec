export const chartColors = [
  "var(--color-primary)",
  "var(--color-foreground)",
  "var(--color-muted-foreground)",
  "#6366f1", // indigo accent
  "#0891b2", // cyan accent
  "#059669", // emerald accent
];

export function getChartColor(index: number): string {
  return chartColors[index % chartColors.length];
}
