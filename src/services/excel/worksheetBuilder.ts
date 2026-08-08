import { EXCEL_COLOR, EXCEL_FONT_SIZE } from "./constants";
import { AlignmentOptions, applyAlignment, applyBorder, applyFill, applyFont, BorderOptions, FontOptions } from "./styles";
import {
  autoFitColumns,
  mergeCells,
  setColumnWidth,
  setRowHeight,
  writeCurrency,
  writeCurrencyFormula,
  writeFormula,
  writePercentage,
  writeValue,
} from "./helpers";

/**
 * Reusable Excel worksheet engine. Every method takes an explicit cell/range
 * address - it holds no row/column cursor and has no idea what a "pipe" or
 * an "estimate" is. Layout decisions (which row things go on, how many rows
 * a section needs) belong to the caller, so this stays reusable for any
 * worksheet the app might need to generate in the future, not just this one.
 */
export class WorksheetBuilder {
  constructor(public readonly sheet: Excel.Worksheet) {}

  writeValue(address: string, value: string | number): Excel.Range {
    return writeValue(this.sheet, address, value);
  }

  writeCurrency(address: string, value: number): Excel.Range {
    return writeCurrency(this.sheet, address, value);
  }

  writePercentage(address: string, decimalValue: number): Excel.Range {
    return writePercentage(this.sheet, address, decimalValue);
  }

  /** Writes a live formula (e.g. "=B4*C4*D4") instead of a static value. */
  writeFormula(address: string, formula: string): Excel.Range {
    return writeFormula(this.sheet, address, formula);
  }

  /** Writes a formula and currency-formats its result. */
  writeCurrencyFormula(address: string, formula: string): Excel.Range {
    return writeCurrencyFormula(this.sheet, address, formula);
  }

  /** A prominent worksheet/document title: large, bold, centered, filled. */
  writeSectionTitle(address: string, value: string): Excel.Range {
    const range = this.writeValue(address, value);
    applyFont(range, { bold: true, size: EXCEL_FONT_SIZE.title, color: EXCEL_COLOR.titleText });
    applyFill(range, EXCEL_COLOR.titleFill);
    applyAlignment(range, { horizontal: Excel.HorizontalAlignment.center, vertical: Excel.VerticalAlignment.center });
    return range;
  }

  /** A column/table header cell: bold, filled, centered. */
  writeHeader(address: string, value: string): Excel.Range {
    const range = this.writeValue(address, value);
    applyFont(range, { bold: true, size: EXCEL_FONT_SIZE.columnHeader, color: EXCEL_COLOR.headerText });
    applyFill(range, EXCEL_COLOR.headerFill);
    applyAlignment(range, { horizontal: Excel.HorizontalAlignment.center, vertical: Excel.VerticalAlignment.center });
    return range;
  }

  mergeCells(address: string): Excel.Range {
    return mergeCells(this.sheet, address);
  }

  applyFont(address: string, options: FontOptions): void {
    applyFont(this.sheet.getRange(address), options);
  }

  applyFill(address: string, color: string): void {
    applyFill(this.sheet.getRange(address), color);
  }

  applyBorder(address: string, options?: BorderOptions): void {
    applyBorder(this.sheet.getRange(address), options);
  }

  applyAlignment(address: string, options: AlignmentOptions): void {
    applyAlignment(this.sheet.getRange(address), options);
  }

  setColumnWidth(address: string, width: number): void {
    setColumnWidth(this.sheet, address, width);
  }

  setRowHeight(address: string, height: number): void {
    setRowHeight(this.sheet, address, height);
  }

  autoFitColumns(address?: string): void {
    autoFitColumns(this.sheet, address);
  }
}
