import { EXCEL_NUMBER_FORMAT } from "./constants";

/**
 * Generic Excel utilities: address arithmetic, value/currency writing, and
 * sizing. No layout decisions and no knowledge of any particular
 * worksheet's structure - everything here takes an explicit address, so a
 * caller building a totally different worksheet can reuse it as-is.
 */

/** Converts a zero-based column index to a column letter (0 -> "A", 25 -> "Z", 26 -> "AA"). */
export function columnLetter(index: number): string {
  let n = index;
  let letters = "";
  do {
    letters = String.fromCharCode((n % 26) + 65) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letters;
}

/** Builds a single-cell address (e.g. "C5") from a zero-based column index and a one-based row number. */
export function cellAddress(columnIndex: number, row: number): string {
  return `${columnLetter(columnIndex)}${row}`;
}

/** Builds a range address (e.g. "A1:E1") from zero-based column indices and one-based row numbers. */
export function rangeAddress(startColumn: number, startRow: number, endColumn: number, endRow: number): string {
  return `${cellAddress(startColumn, startRow)}:${cellAddress(endColumn, endRow)}`;
}

const INVALID_SHEET_NAME_CHARS = /[:\\/?*[\]]/g;

/** Turns an arbitrary string into a valid Excel worksheet name (Excel disallows `: \ / ? * [ ]` and caps names at 31 characters). */
export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(INVALID_SHEET_NAME_CHARS, " ").trim();
  return (cleaned.length > 0 ? cleaned : "Sheet").slice(0, 31);
}

export function writeValue(sheet: Excel.Worksheet, address: string, value: string | number): Excel.Range {
  const range = sheet.getRange(address);
  range.values = [[value]];
  return range;
}

export function writeCurrency(sheet: Excel.Worksheet, address: string, value: number): Excel.Range {
  const range = writeValue(sheet, address, value);
  range.numberFormat = [[EXCEL_NUMBER_FORMAT.currency]];
  return range;
}

/** Writes a live Excel formula (e.g. "=B4*C4*D4") into a cell, rather than a static value. */
export function writeFormula(sheet: Excel.Worksheet, address: string, formula: string): Excel.Range {
  const range = sheet.getRange(address);
  range.formulas = [[formula]];
  return range;
}

/** Writes a formula and applies currency formatting to its result. */
export function writeCurrencyFormula(sheet: Excel.Worksheet, address: string, formula: string): Excel.Range {
  const range = writeFormula(sheet, address, formula);
  range.numberFormat = [[EXCEL_NUMBER_FORMAT.currency]];
  return range;
}

export function writePercentage(sheet: Excel.Worksheet, address: string, decimalValue: number): Excel.Range {
  const range = writeValue(sheet, address, decimalValue);
  range.numberFormat = [[EXCEL_NUMBER_FORMAT.percentage]];
  return range;
}

export function mergeCells(sheet: Excel.Worksheet, address: string): Excel.Range {
  const range = sheet.getRange(address);
  range.merge(false);
  return range;
}

export function setColumnWidth(sheet: Excel.Worksheet, address: string, width: number): void {
  sheet.getRange(address).format.columnWidth = width;
}

export function setRowHeight(sheet: Excel.Worksheet, address: string, height: number): void {
  sheet.getRange(address).format.rowHeight = height;
}

export function autoFitColumns(sheet: Excel.Worksheet, address?: string): void {
  const range = address ? sheet.getRange(address) : sheet.getUsedRange();
  range.format.autofitColumns();
}
