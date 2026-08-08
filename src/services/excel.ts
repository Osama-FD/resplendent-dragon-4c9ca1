import { Estimate, EstimateExcelLocation } from "../models/Estimate";
import { CalculationResult } from "../models/Calculation";
import { Material } from "../models/Material";
import { generateWorksheet } from "./excel/excelGenerator";
import { WorksheetBuilder } from "./excel/worksheetBuilder";
import { cellAddress, columnLetter, rangeAddress } from "./excel/helpers";
import { EXCEL_COLOR } from "./excel/constants";

/**
 * Excel integration service. This file is the only place in the app that
 * knows what an Estimate worksheet should look like. Business calculations
 * are never performed here - every number comes from a CalculationResult
 * already computed by calculator.ts; this file only decides layout,
 * formulas (which reference other cells within the same estimate's own
 * section), and formatting. Built entirely from the generic engine in
 * ./excel/ (WorksheetBuilder, excelGenerator) - no engine changes were
 * needed for this formatting pass.
 */

/** One estimate plus its already-computed calculation result, ready to be written to Excel. */
export interface EstimateWithResult {
  estimate: Estimate;
  result: CalculationResult;
}

export interface ExcelService {
  /**
   * Rebuilds the single shared "Estimates" worksheet from the given list.
   * Every item gets its own section, stacked in order with spacing; an
   * estimate already generated before lands in the same relative position
   * (by array order) so nothing is duplicated. Returns the same estimates
   * with a fresh `excelLocation` - the caller is responsible for
   * persisting them (this service never touches storage).
   */
  syncAllEstimates(
    items: EstimateWithResult[],
    materials: Material[],
    ohPercentage: number,
    marginPercentage: number
  ): Promise<Estimate[]>;

  /**
   * Regenerates only the estimate identified by `targetId`, in place:
   * its own section is rewritten, the Summary Table row for it is
   * refreshed, and every other estimate's section is left untouched
   * (only shifted down/up as a block if the target's row count changed).
   * `items` must be the full, current list (same order as the last full
   * sync) so the Summary Table row and any other estimates' locations can
   * be resolved correctly. Falls back to a full `syncAllEstimates` if the
   * sheet isn't in the expected state (e.g. never generated before, or an
   * estimate is missing its excelLocation) - always safe to call.
   */
  regenerateEstimate(
    items: EstimateWithResult[],
    targetId: string,
    materials: Material[],
    ohPercentage: number,
    marginPercentage: number
  ): Promise<Estimate[]>;

  /** Activates the shared worksheet and selects the start of the given estimate's section. */
  openEstimateInExcel(estimate: Estimate): Promise<void>;
}

export const ESTIMATES_SHEET_NAME = "Estimates";

// Each fix table mirrors the original template: Item, Length, Qty, Unit Cost, Total Cost.
const COLS_PER_TABLE = 5;
const FIRST_FIX_START_COL = 0; // A
const GAP_COLS = 1;
const SECOND_FIX_START_COL = FIRST_FIX_START_COL + COLS_PER_TABLE + GAP_COLS; // G
const LAST_COL = SECOND_FIX_START_COL + COLS_PER_TABLE - 1; // K

const COL_OFFSET = {
  item: 0,
  length: 1,
  qty: 2,
  unitCost: 3,
  totalCost: 4,
} as const;

const SECTION_SPACER_ROWS = 2;

// Typography matched to the original template - see PROJECT_SPEC's Phase 5.4 formatting pass.
const FONT_SIZE = {
  title: 20,
  sectionHeader: 12,
  columnHeader: 11,
  materialName: 16,
  numericCell: 11,
  mpLabel: 16,
  mpValue: 11,
  totalLabel: 12,
  totalValue: 12,
  summary: 16,
} as const;

const ROW_HEIGHT = {
  title: 30,
  sectionHeader: 18,
  columnHeader: 18,
  materialRow: 24,
  mpRow: 24,
  totalRow: 20,
  summaryRow: 22,
} as const;

const COLUMN_WIDTH = {
  item: 160,
  length: 60,
  qty: 55,
  unitCost: 90,
  totalCost: 100,
  gap: 20,
} as const;

function materialName(materials: Material[], materialId: string): string {
  return materials.find((material) => material.id === materialId)?.name ?? "(unknown material)";
}

/**
 * Every row an estimate's section occupies, derived purely from its
 * CalculationResult (pipe/cable/accessory counts) and its starting row -
 * no writing involved. This is what lets the Summary Table's Grand Total
 * formulas be computed before any section is actually written, and what
 * lets a single-estimate regenerate figure out its new row count without
 * touching the sheet.
 */
interface EstimateSectionLayout {
  startRow: number;
  titleRow: number;
  sectionHeaderRow: number;
  columnHeaderRow: number;
  firstDataRow: number;
  firstFixMpRow: number;
  firstFixTotalRow: number;
  secondFixMpRow: number;
  secondFixTotalRow: number;
  totalPriceRow: number;
  ohRow: number;
  totalWithOhRow: number;
  marginRow: number;
  grandTotalRow: number;
  dividerRow: number;
  endRow: number;
  rowCount: number;
}

function computeSectionLayout(startRow: number, result: CalculationResult): EstimateSectionLayout {
  const titleRow = startRow;
  const sectionHeaderRow = startRow + 1;
  const columnHeaderRow = startRow + 2;
  const firstDataRow = startRow + 3;

  const firstFixMpRow = firstDataRow + result.pipes.length + result.accessories.length;
  const firstFixTotalRow = firstFixMpRow + 1;

  // Second Fix always has exactly one Flexible Point row in addition to its cables.
  const secondFixMpRow = firstDataRow + result.cables.length + 1;
  const secondFixTotalRow = secondFixMpRow + 1;

  const totalPriceRow = Math.max(firstFixTotalRow, secondFixTotalRow) + 2;
  const ohRow = totalPriceRow + 1;
  const totalWithOhRow = totalPriceRow + 2;
  const marginRow = totalPriceRow + 3;
  const grandTotalRow = totalPriceRow + 4;
  const dividerRow = grandTotalRow + 1;

  return {
    startRow,
    titleRow,
    sectionHeaderRow,
    columnHeaderRow,
    firstDataRow,
    firstFixMpRow,
    firstFixTotalRow,
    secondFixMpRow,
    secondFixTotalRow,
    totalPriceRow,
    ohRow,
    totalWithOhRow,
    marginRow,
    grandTotalRow,
    dividerRow,
    endRow: dividerRow,
    rowCount: dividerRow - startRow + 1,
  };
}

/** Column that holds the Grand Total value inside any estimate section (fixed, regardless of the section's row). */
const SUMMARY_VALUE_COL = FIRST_FIX_START_COL + 1; // B

function writeTableHeaderRow(builder: WorksheetBuilder, startCol: number, row: number): void {
  const labels = ["Item", "Length", "Qty", "Unit Cost", "Total Cost"];
  labels.forEach((label, offset) => {
    const address = cellAddress(startCol + offset, row);
    builder.writeValue(address, label);
    builder.applyFont(address, { bold: false, size: FONT_SIZE.columnHeader, color: EXCEL_COLOR.headerText });
    builder.applyFill(address, EXCEL_COLOR.headerFill);
    builder.applyAlignment(address, { horizontal: Excel.HorizontalAlignment.center, vertical: Excel.VerticalAlignment.center });
  });
  builder.setRowHeight(cellAddress(startCol, row), ROW_HEIGHT.columnHeader);
}

function styleNumericCells(builder: WorksheetBuilder, cells: string[]): void {
  cells.forEach((address) => builder.applyFont(address, { bold: false, size: FONT_SIZE.numericCell }));
}

/** A material/length/qty row: Total Cost = Length × Qty × Unit Cost. */
function writeMaterialRow(
  builder: WorksheetBuilder,
  startCol: number,
  row: number,
  name: string,
  length: number,
  quantity: number,
  unitCost: number
): void {
  const item = cellAddress(startCol + COL_OFFSET.item, row);
  const lengthCell = cellAddress(startCol + COL_OFFSET.length, row);
  const qtyCell = cellAddress(startCol + COL_OFFSET.qty, row);
  const unitCostCell = cellAddress(startCol + COL_OFFSET.unitCost, row);
  const totalCostCell = cellAddress(startCol + COL_OFFSET.totalCost, row);

  builder.writeValue(item, name);
  builder.writeValue(lengthCell, length);
  builder.writeValue(qtyCell, quantity);
  builder.writeCurrency(unitCostCell, unitCost);
  builder.writeCurrencyFormula(totalCostCell, `=${lengthCell}*${qtyCell}*${unitCostCell}`);

  builder.applyFont(item, { bold: true, size: FONT_SIZE.materialName });
  styleNumericCells(builder, [lengthCell, qtyCell, unitCostCell, totalCostCell]);
  builder.setRowHeight(item, ROW_HEIGHT.materialRow);
}

/** A quantity-only row (accessory/flexible point): Length+Qty merged, Total Cost = Qty × Unit Cost. */
function writeQuantityOnlyRow(
  builder: WorksheetBuilder,
  startCol: number,
  row: number,
  name: string,
  quantity: number,
  unitCost: number
): void {
  const item = cellAddress(startCol + COL_OFFSET.item, row);
  const qtyCell = cellAddress(startCol + COL_OFFSET.length, row);
  const unitCostCell = cellAddress(startCol + COL_OFFSET.unitCost, row);
  const totalCostCell = cellAddress(startCol + COL_OFFSET.totalCost, row);

  builder.writeValue(item, name);
  builder.writeValue(qtyCell, quantity);
  builder.mergeCells(rangeAddress(startCol + COL_OFFSET.length, row, startCol + COL_OFFSET.qty, row));
  builder.writeCurrency(unitCostCell, unitCost);
  builder.writeCurrencyFormula(totalCostCell, `=${qtyCell}*${unitCostCell}`);

  builder.applyFont(item, { bold: true, size: FONT_SIZE.materialName });
  styleNumericCells(builder, [qtyCell, unitCostCell, totalCostCell]);
  builder.setRowHeight(item, ROW_HEIGHT.materialRow);
}

/**
 * The "M.P" row, matching the original template exactly: Item = "M.P",
 * Length left blank, Qty = 1, Unit Cost = the MP aggregate, Total Cost =
 * Qty × Unit Cost (so it's still a formula, even though there's no longer
 * a per-row MP column for it to sum from - mpTotal itself is read
 * straight off CalculationResult, not computed here).
 */
function writeMpRow(builder: WorksheetBuilder, startCol: number, row: number, mpTotal: number): void {
  const item = cellAddress(startCol + COL_OFFSET.item, row);
  const qtyCell = cellAddress(startCol + COL_OFFSET.qty, row);
  const unitCostCell = cellAddress(startCol + COL_OFFSET.unitCost, row);
  const totalCostCell = cellAddress(startCol + COL_OFFSET.totalCost, row);

  builder.writeValue(item, "M.P");
  // Length is intentionally left blank - M.P has no length of its own.
  builder.writeValue(qtyCell, 1);
  builder.writeCurrency(unitCostCell, mpTotal);
  builder.writeCurrencyFormula(totalCostCell, `=${qtyCell}*${unitCostCell}`);

  builder.applyFont(item, { bold: true, size: FONT_SIZE.mpLabel });
  styleNumericCells(builder, [qtyCell, unitCostCell, totalCostCell]);
  builder.setRowHeight(item, ROW_HEIGHT.mpRow);
}

/** The "Total" row: one SUM formula over the Total Cost column, spanning dataStartRow..dataEndRow (pipes/cables + accessories/flex point + the M.P row). */
function writeSectionTotalRow(
  builder: WorksheetBuilder,
  startCol: number,
  row: number,
  dataStartRow: number,
  dataEndRow: number
): void {
  const item = cellAddress(startCol + COL_OFFSET.item, row);
  const totalCostCell = cellAddress(startCol + COL_OFFSET.totalCost, row);
  const totalCostCol = columnLetter(startCol + COL_OFFSET.totalCost);

  builder.writeValue(item, "Total");
  builder.mergeCells(rangeAddress(startCol + COL_OFFSET.item, row, startCol + COL_OFFSET.unitCost, row));
  builder.applyFont(item, { bold: true, size: FONT_SIZE.totalLabel });

  // A side can legitimately have no data rows (e.g. no pipes and no
  // accessories) - the M.P row always exists though, so dataEndRow is only
  // ever less than dataStartRow if there is truly nothing above it yet.
  if (dataEndRow >= dataStartRow) {
    builder.writeCurrencyFormula(totalCostCell, `=SUM(${totalCostCol}${dataStartRow}:${totalCostCol}${dataEndRow})`);
  } else {
    builder.writeCurrency(totalCostCell, 0);
  }
  builder.applyFont(totalCostCell, { bold: true, size: FONT_SIZE.totalValue });
  builder.setRowHeight(item, ROW_HEIGHT.totalRow);

  builder.applyBorder(rangeAddress(startCol, row, startCol + COLS_PER_TABLE - 1, row));
}

/** Writes one estimate's full section into the rows described by `layout`. */
function writeEstimateSection(
  builder: WorksheetBuilder,
  layout: EstimateSectionLayout,
  estimate: Estimate,
  result: CalculationResult,
  materials: Material[],
  ohPercentage: number,
  marginPercentage: number
): void {
  const {
    titleRow,
    sectionHeaderRow,
    columnHeaderRow,
    firstDataRow,
    firstFixMpRow,
    firstFixTotalRow,
    secondFixMpRow,
    secondFixTotalRow,
    totalPriceRow,
    ohRow,
    totalWithOhRow,
    marginRow,
    grandTotalRow,
    dividerRow,
  } = layout;

  // Title
  const titleAddress = cellAddress(FIRST_FIX_START_COL, titleRow);
  builder.writeValue(titleAddress, estimate.title || "(untitled estimate)");
  builder.mergeCells(rangeAddress(FIRST_FIX_START_COL, titleRow, LAST_COL, titleRow));
  builder.applyFont(titleAddress, { bold: true, size: FONT_SIZE.title, color: EXCEL_COLOR.titleText });
  builder.applyFill(titleAddress, EXCEL_COLOR.titleFill);
  builder.applyAlignment(titleAddress, { horizontal: Excel.HorizontalAlignment.center, vertical: Excel.VerticalAlignment.center });
  builder.setRowHeight(titleAddress, ROW_HEIGHT.title);

  // "1st, fix" / "2nd, fix" section headers
  const fixSectionHeaders: Array<{ startCol: number; label: string }> = [
    { startCol: FIRST_FIX_START_COL, label: "1st, fix" },
    { startCol: SECOND_FIX_START_COL, label: "2nd, fix" },
  ];
  fixSectionHeaders.forEach(({ startCol, label }) => {
    const address = cellAddress(startCol, sectionHeaderRow);
    builder.writeValue(address, label);
    builder.mergeCells(rangeAddress(startCol, sectionHeaderRow, startCol + COLS_PER_TABLE - 1, sectionHeaderRow));
    builder.applyFont(address, { bold: false, size: FONT_SIZE.sectionHeader });
    builder.applyFill(address, EXCEL_COLOR.sectionFill);
    builder.applyAlignment(address, { horizontal: Excel.HorizontalAlignment.center });
    builder.setRowHeight(address, ROW_HEIGHT.sectionHeader);
  });

  // Column headers
  writeTableHeaderRow(builder, FIRST_FIX_START_COL, columnHeaderRow);
  writeTableHeaderRow(builder, SECOND_FIX_START_COL, columnHeaderRow);

  // First Fix: pipes, then accessories, then the M.P row.
  let firstFixRow = firstDataRow;
  result.pipes.forEach((line) => {
    writeMaterialRow(builder, FIRST_FIX_START_COL, firstFixRow, materialName(materials, line.materialId), line.length, line.quantity, line.unitCost);
    firstFixRow += 1;
  });
  result.accessories.forEach((line) => {
    writeQuantityOnlyRow(builder, FIRST_FIX_START_COL, firstFixRow, materialName(materials, line.materialId), line.quantity, line.unitCost);
    firstFixRow += 1;
  });
  writeMpRow(builder, FIRST_FIX_START_COL, firstFixMpRow, result.pipeMp);
  // The M.P row always exists, so it's always the last row in the SUM range - covers pipes + accessories + M.P together.
  writeSectionTotalRow(builder, FIRST_FIX_START_COL, firstFixTotalRow, firstDataRow, firstFixMpRow);

  // Second Fix: cables, then the single Flexible Point row, then the M.P row.
  let secondFixRow = firstDataRow;
  result.cables.forEach((line) => {
    writeMaterialRow(builder, SECOND_FIX_START_COL, secondFixRow, materialName(materials, line.materialId), line.length, line.quantity, line.unitCost);
    secondFixRow += 1;
  });
  writeQuantityOnlyRow(builder, SECOND_FIX_START_COL, secondFixRow, "Flexible Point", result.flexiblePoints.quantity, result.flexiblePoints.unitCost);
  writeMpRow(builder, SECOND_FIX_START_COL, secondFixMpRow, result.secondFixMp);
  writeSectionTotalRow(builder, SECOND_FIX_START_COL, secondFixTotalRow, firstDataRow, secondFixMpRow);

  // Summary block - 5 rows, matching the original template.
  const firstFixTotalCell = cellAddress(FIRST_FIX_START_COL + COL_OFFSET.totalCost, firstFixTotalRow);
  const secondFixTotalCell = cellAddress(SECOND_FIX_START_COL + COL_OFFSET.totalCost, secondFixTotalRow);
  const labelCol = FIRST_FIX_START_COL;
  const valueCol = SUMMARY_VALUE_COL;

  const totalPriceCell = cellAddress(valueCol, totalPriceRow);
  const ohPercentCell = cellAddress(valueCol, ohRow);
  const totalWithOhCell = cellAddress(valueCol, totalWithOhRow);
  const marginPercentCell = cellAddress(valueCol, marginRow);
  const grandTotalCell = cellAddress(valueCol, grandTotalRow);

  builder.writeValue(cellAddress(labelCol, totalPriceRow), "Total Price");
  builder.writeCurrencyFormula(totalPriceCell, `=${firstFixTotalCell}+${secondFixTotalCell}`);

  builder.writeValue(cellAddress(labelCol, ohRow), "O.H & Super.");
  builder.writePercentage(ohPercentCell, ohPercentage / 100);

  builder.writeValue(cellAddress(labelCol, totalWithOhRow), "Total with O.H");
  builder.writeCurrencyFormula(totalWithOhCell, `=${totalPriceCell}+${totalPriceCell}*${ohPercentCell}`);

  builder.writeValue(cellAddress(labelCol, marginRow), "Margin");
  builder.writePercentage(marginPercentCell, marginPercentage / 100);

  builder.writeValue(cellAddress(labelCol, grandTotalRow), "Grand Total");
  builder.writeCurrencyFormula(grandTotalCell, `=${totalWithOhCell}+${totalWithOhCell}*${marginPercentCell}`);

  [totalPriceRow, ohRow, totalWithOhRow, marginRow, grandTotalRow].forEach((row) => {
    builder.applyFont(cellAddress(labelCol, row), { bold: true, size: FONT_SIZE.summary });
    builder.applyFont(cellAddress(valueCol, row), { bold: true, size: FONT_SIZE.summary });
    builder.applyBorder(rangeAddress(labelCol, row, valueCol, row));
    builder.setRowHeight(cellAddress(labelCol, row), ROW_HEIGHT.summaryRow);
  });
  builder.applyFill(rangeAddress(labelCol, grandTotalRow, valueCol, grandTotalRow), EXCEL_COLOR.grandTotalFill);

  // Full-width divider directly below the summary, separating this estimate from the next.
  builder.applyBorder(rangeAddress(FIRST_FIX_START_COL, dividerRow, LAST_COL, dividerRow), {
    edges: [Excel.BorderIndex.edgeBottom],
    weight: Excel.BorderWeight.medium,
  });
}

/** Where the Estimate Summary table sits, derived purely from how many estimates there are. */
interface SummaryTableLayout {
  titleRow: number;
  headerRow: number;
  dataStartRow: number;
  dataEndRow: number;
  endRow: number;
}

function computeSummaryTableLayout(estimateCount: number): SummaryTableLayout {
  const titleRow = 1;
  const headerRow = 2;
  const dataStartRow = 3;
  const dataEndRow = estimateCount > 0 ? dataStartRow + estimateCount - 1 : dataStartRow - 1;
  const endRow = dataEndRow >= dataStartRow ? dataEndRow : headerRow;
  return { titleRow, headerRow, dataStartRow, dataEndRow, endRow };
}

/**
 * Writes the "ESTIMATE SUMMARY" table at the top of the sheet: one row per
 * estimate, each Grand Total cell a live formula pointing at that
 * estimate's own section (never a static copy), so it always reflects the
 * section's current numbers. Sized purely from `items.length` - callers
 * that only need to refresh one row (single-estimate regenerate) write
 * directly instead of calling this.
 */
function writeSummaryTable(
  builder: WorksheetBuilder,
  layout: SummaryTableLayout,
  items: EstimateWithResult[],
  sectionLayouts: EstimateSectionLayout[]
): void {
  const nameStartCol = FIRST_FIX_START_COL;
  const nameEndCol = FIRST_FIX_START_COL + COLS_PER_TABLE - 1; // E
  const valueStartCol = SECOND_FIX_START_COL; // G
  const valueEndCol = LAST_COL; // K

  // Title
  const titleAddress = cellAddress(nameStartCol, layout.titleRow);
  builder.writeValue(titleAddress, "ESTIMATE SUMMARY");
  builder.mergeCells(rangeAddress(nameStartCol, layout.titleRow, LAST_COL, layout.titleRow));
  builder.applyFont(titleAddress, { bold: true, size: FONT_SIZE.title, color: EXCEL_COLOR.titleText });
  builder.applyFill(titleAddress, EXCEL_COLOR.titleFill);
  builder.applyAlignment(titleAddress, { horizontal: Excel.HorizontalAlignment.center, vertical: Excel.VerticalAlignment.center });
  builder.setRowHeight(titleAddress, ROW_HEIGHT.title);

  // Header
  const nameHeaderAddress = cellAddress(nameStartCol, layout.headerRow);
  const valueHeaderAddress = cellAddress(valueStartCol, layout.headerRow);
  builder.writeValue(nameHeaderAddress, "Estimate Name");
  builder.mergeCells(rangeAddress(nameStartCol, layout.headerRow, nameEndCol, layout.headerRow));
  builder.writeValue(valueHeaderAddress, "Grand Total");
  builder.mergeCells(rangeAddress(valueStartCol, layout.headerRow, valueEndCol, layout.headerRow));
  [nameHeaderAddress, valueHeaderAddress].forEach((address) => {
    builder.applyFont(address, { bold: false, size: FONT_SIZE.columnHeader, color: EXCEL_COLOR.headerText });
    builder.applyFill(address, EXCEL_COLOR.headerFill);
    builder.applyAlignment(address, { horizontal: Excel.HorizontalAlignment.center, vertical: Excel.VerticalAlignment.center });
  });
  builder.setRowHeight(nameHeaderAddress, ROW_HEIGHT.columnHeader);

  // Data rows
  items.forEach(({ estimate }, index) => {
    writeSummaryRow(builder, layout.dataStartRow + index, estimate, sectionLayouts[index]);
  });

  // Divider directly below the table, separating it from the first estimate section.
  const dividerRow = Math.max(layout.headerRow, layout.dataEndRow);
  builder.applyBorder(rangeAddress(nameStartCol, dividerRow, LAST_COL, dividerRow), {
    edges: [Excel.BorderIndex.edgeBottom],
    weight: Excel.BorderWeight.medium,
  });
}

/** Writes (or overwrites) a single Summary Table data row for one estimate. */
function writeSummaryRow(builder: WorksheetBuilder, row: number, estimate: Estimate, sectionLayout: EstimateSectionLayout): void {
  const nameEndCol = FIRST_FIX_START_COL + COLS_PER_TABLE - 1; // E
  const nameAddress = cellAddress(FIRST_FIX_START_COL, row);
  const valueAddress = cellAddress(SECOND_FIX_START_COL, row);
  const grandTotalCell = cellAddress(SUMMARY_VALUE_COL, sectionLayout.grandTotalRow);

  builder.writeValue(nameAddress, estimate.title || "(untitled estimate)");
  builder.mergeCells(rangeAddress(FIRST_FIX_START_COL, row, nameEndCol, row));
  builder.writeCurrencyFormula(valueAddress, `=${grandTotalCell}`);
  builder.mergeCells(rangeAddress(SECOND_FIX_START_COL, row, LAST_COL, row));

  builder.applyFont(nameAddress, { bold: true, size: FONT_SIZE.materialName });
  builder.applyFont(valueAddress, { bold: true, size: FONT_SIZE.totalValue });
  builder.applyAlignment(valueAddress, { horizontal: Excel.HorizontalAlignment.center, vertical: Excel.VerticalAlignment.center });
  builder.setRowHeight(nameAddress, ROW_HEIGHT.materialRow);
}

function setColumnWidths(builder: WorksheetBuilder): void {
  [FIRST_FIX_START_COL, SECOND_FIX_START_COL].forEach((startCol) => {
    builder.setColumnWidth(cellAddress(startCol + COL_OFFSET.item, 1), COLUMN_WIDTH.item);
    builder.setColumnWidth(cellAddress(startCol + COL_OFFSET.length, 1), COLUMN_WIDTH.length);
    builder.setColumnWidth(cellAddress(startCol + COL_OFFSET.qty, 1), COLUMN_WIDTH.qty);
    builder.setColumnWidth(cellAddress(startCol + COL_OFFSET.unitCost, 1), COLUMN_WIDTH.unitCost);
    builder.setColumnWidth(cellAddress(startCol + COL_OFFSET.totalCost, 1), COLUMN_WIDTH.totalCost);
  });
  builder.setColumnWidth(cellAddress(FIRST_FIX_START_COL + COLS_PER_TABLE, 1), COLUMN_WIDTH.gap);
}

/** Lays out every item in order, starting right after the Summary Table. Pure - no writes. */
function computeAllSectionLayouts(items: EstimateWithResult[], summaryLayout: SummaryTableLayout): EstimateSectionLayout[] {
  let nextRow = summaryLayout.endRow + 1 + SECTION_SPACER_ROWS;
  return items.map(({ result }) => {
    const layout = computeSectionLayout(nextRow, result);
    nextRow = layout.endRow + 1 + SECTION_SPACER_ROWS;
    return layout;
  });
}

async function regenerateInPlace(
  items: EstimateWithResult[],
  targetIndex: number,
  materials: Material[],
  ohPercentage: number,
  marginPercentage: number
): Promise<Estimate[]> {
  const { estimate: targetEstimate, result: targetResult } = items[targetIndex];
  const oldLocation = targetEstimate.excelLocation;
  if (!oldLocation) {
    throw new Error("This estimate has no existing Excel location to regenerate in place.");
  }

  const oldRowCount = oldLocation.endRow - oldLocation.startRow + 1;
  const newLayout = computeSectionLayout(oldLocation.startRow, targetResult);
  const delta = newLayout.rowCount - oldRowCount;
  const now = new Date().toISOString();
  const summaryLayout = computeSummaryTableLayout(items.length);
  const summaryRow = summaryLayout.dataStartRow + targetIndex;

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItemOrNullObject(oldLocation.worksheetName);
    sheet.load("isNullObject");
    await context.sync();

    if (sheet.isNullObject) {
      throw new Error(`Worksheet "${oldLocation.worksheetName}" no longer exists.`);
    }

    // Grow or shrink the section in place - Excel auto-adjusts every other
    // formula's cell references (including the Summary Table's references
    // to OTHER estimates) when rows are inserted/deleted with a shift,
    // unlike a clear+rewrite which would silently break them.
    if (delta > 0) {
      const insertRange = sheet.getRange(
        rangeAddress(FIRST_FIX_START_COL, oldLocation.endRow + 1, LAST_COL, oldLocation.endRow + delta)
      );
      insertRange.insert(Excel.InsertShiftDirection.down);
    } else if (delta < 0) {
      const deleteRange = sheet.getRange(
        rangeAddress(FIRST_FIX_START_COL, oldLocation.endRow + delta + 1, LAST_COL, oldLocation.endRow)
      );
      deleteRange.delete(Excel.DeleteShiftDirection.up);
    }

    const fullRange = sheet.getRange(rangeAddress(FIRST_FIX_START_COL, newLayout.startRow, LAST_COL, newLayout.endRow));
    fullRange.unmerge();
    fullRange.clear(Excel.ClearApplyTo.all);

    const builder = new WorksheetBuilder(sheet);
    writeEstimateSection(builder, newLayout, targetEstimate, targetResult, materials, ohPercentage, marginPercentage);
    writeSummaryRow(builder, summaryRow, targetEstimate, newLayout);

    await context.sync();
  });

  return items.map(({ estimate }, index) => {
    if (index === targetIndex) {
      return {
        ...estimate,
        excelLocation: {
          worksheetName: oldLocation.worksheetName,
          startRow: newLayout.startRow,
          endRow: newLayout.endRow,
          lastGeneratedAt: now,
        },
      };
    }
    const location = estimate.excelLocation;
    if (delta !== 0 && location && location.startRow > oldLocation.endRow) {
      return { ...estimate, excelLocation: { ...location, startRow: location.startRow + delta, endRow: location.endRow + delta } };
    }
    return estimate;
  });
}

export const excelService: ExcelService = {
  async syncAllEstimates(items, materials, ohPercentage, marginPercentage) {
    const locations: Array<{ id: string; location: EstimateExcelLocation }> = [];
    const now = new Date().toISOString();

    await generateWorksheet(ESTIMATES_SHEET_NAME, async (builder) => {
      const summaryLayout = computeSummaryTableLayout(items.length);
      const sectionLayouts = computeAllSectionLayouts(items, summaryLayout);

      writeSummaryTable(builder, summaryLayout, items, sectionLayouts);

      items.forEach(({ estimate, result }, index) => {
        const layout = sectionLayouts[index];
        writeEstimateSection(builder, layout, estimate, result, materials, ohPercentage, marginPercentage);
        locations.push({
          id: estimate.id,
          location: {
            worksheetName: ESTIMATES_SHEET_NAME,
            startRow: layout.startRow,
            endRow: layout.endRow,
            lastGeneratedAt: now,
          },
        });
      });

      setColumnWidths(builder);
    });

    const locationById = new Map(locations.map((entry) => [entry.id, entry.location]));
    return items.map(({ estimate }) => ({
      ...estimate,
      excelLocation: locationById.get(estimate.id),
    }));
  },

  async regenerateEstimate(items, targetId, materials, ohPercentage, marginPercentage) {
    const targetIndex = items.findIndex(({ estimate }) => estimate.id === targetId);
    const allHaveLocations = items.every(
      ({ estimate }) => estimate.excelLocation?.worksheetName === ESTIMATES_SHEET_NAME
    );

    if (targetIndex === -1 || !allHaveLocations) {
      return this.syncAllEstimates(items, materials, ohPercentage, marginPercentage);
    }

    try {
      return await regenerateInPlace(items, targetIndex, materials, ohPercentage, marginPercentage);
    } catch {
      return this.syncAllEstimates(items, materials, ohPercentage, marginPercentage);
    }
  },

  async openEstimateInExcel(estimate) {
    const location = estimate.excelLocation;
    if (!location) {
      throw new Error("This estimate hasn't been generated into Excel yet.");
    }

    await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getItemOrNullObject(location.worksheetName);
      sheet.load("isNullObject");
      await context.sync();

      if (sheet.isNullObject) {
        throw new Error(`Worksheet "${location.worksheetName}" no longer exists.`);
      }

      sheet.activate();
      const range = sheet.getRange(cellAddress(FIRST_FIX_START_COL, location.startRow));
      range.select();
      await context.sync();
    });
  },
};
