/**
 * Shared visual defaults for Excel worksheet generation. Purely
 * presentational - this file has no knowledge of estimates, materials, or
 * any other business concept, so it stays reusable for any future
 * worksheet the app might generate.
 */
export const EXCEL_FONT_NAME = "Calibri";

export const EXCEL_FONT_SIZE = {
  title: 14,
  sectionHeading: 12,
  columnHeader: 11,
  body: 11,
} as const;

export const EXCEL_COLOR = {
  titleFill: "#1F4E78",
  titleText: "#FFFFFF",
  sectionFill: "#D9E1F2",
  headerFill: "#4472C4",
  headerText: "#FFFFFF",
  totalFill: "#FCE4D6",
  grandTotalFill: "#FFD966",
  border: "#8EA9DB",
} as const;

export const EXCEL_NUMBER_FORMAT = {
  currency: "#,##0.00",
  percentage: "0%",
  integer: "0",
} as const;

export const DEFAULT_COLUMN_WIDTH = 90;
export const DEFAULT_ROW_HEIGHT = 18;
