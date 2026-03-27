import { z } from "zod";

// --- Icons ---
export const iconSchema = z
  .string()
  .min(1)
  .describe("Icon name (e.g. 'rocket', 'ph:shield-check')");

// --- Charts ---
export const chartDataPointSchema = z.object({
  label: z.string().describe("Data point label"),
  value: z.number().describe("Data point value"),
});

export type ChartDataPoint = z.infer<typeof chartDataPointSchema>;

export const chartSeriesSchema = z.object({
  name: z.string().describe("Series name for legend"),
  color: z.string().optional().describe("Color token name or CSS value"),
  data: z.array(z.number()).min(1).describe("Data values"),
});

export type ChartSeries = z.infer<typeof chartSeriesSchema>;

// --- Assets ---
export const svgAssetSchema = z
  .string()
  .min(1)
  .describe("Path to SVG file relative to deck directory");

export const imageSchema = z
  .string()
  .min(1)
  .describe("Image path (relative to deck) or https:// URL");
