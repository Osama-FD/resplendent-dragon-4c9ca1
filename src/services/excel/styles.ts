import { EXCEL_FONT_NAME } from "./constants";

/**
 * Low-level style appliers - each operates on a single Excel.Range and one
 * visual concern (font, fill, border, alignment). No value-writing, no
 * layout decisions, no knowledge of what the range is used for. These are
 * the building blocks worksheetBuilder.ts composes into higher-level
 * operations like writeHeader/writeSectionTitle.
 */

export interface FontOptions {
  bold?: boolean;
  italic?: boolean;
  size?: number;
  color?: string;
  name?: string;
}

export function applyFont(range: Excel.Range, options: FontOptions): void {
  const font = range.format.font;
  font.name = options.name ?? EXCEL_FONT_NAME;
  if (options.bold !== undefined) {
    font.bold = options.bold;
  }
  if (options.italic !== undefined) {
    font.italic = options.italic;
  }
  if (options.size !== undefined) {
    font.size = options.size;
  }
  if (options.color !== undefined) {
    font.color = options.color;
  }
}

export function applyFill(range: Excel.Range, color: string): void {
  range.format.fill.color = color;
}

const ALL_BORDER_EDGES: Excel.BorderIndex[] = [
  Excel.BorderIndex.edgeTop,
  Excel.BorderIndex.edgeBottom,
  Excel.BorderIndex.edgeLeft,
  Excel.BorderIndex.edgeRight,
  Excel.BorderIndex.insideHorizontal,
  Excel.BorderIndex.insideVertical,
];

export interface BorderOptions {
  style?: Excel.BorderLineStyle;
  color?: string;
  weight?: Excel.BorderWeight;
  /** Defaults to all outer + inner edges. Pass a subset (e.g. just outer edges) to box a range without gridlines inside it. */
  edges?: Excel.BorderIndex[];
}

export function applyBorder(range: Excel.Range, options: BorderOptions = {}): void {
  const edges = options.edges ?? ALL_BORDER_EDGES;
  edges.forEach((edge) => {
    const border = range.format.borders.getItem(edge);
    border.style = options.style ?? Excel.BorderLineStyle.continuous;
    border.color = options.color ?? "#000000";
    border.weight = options.weight ?? Excel.BorderWeight.thin;
  });
}

export interface AlignmentOptions {
  horizontal?: Excel.HorizontalAlignment;
  vertical?: Excel.VerticalAlignment;
  wrapText?: boolean;
}

export function applyAlignment(range: Excel.Range, options: AlignmentOptions): void {
  if (options.horizontal !== undefined) {
    range.format.horizontalAlignment = options.horizontal;
  }
  if (options.vertical !== undefined) {
    range.format.verticalAlignment = options.vertical;
  }
  if (options.wrapText !== undefined) {
    range.format.wrapText = options.wrapText;
  }
}
