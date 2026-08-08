/**
 * A First Fix pipe row. `id` identifies the row itself (for edit/remove) and
 * is distinct from `materialId` - two rows can reference the same material
 * with different lengths/quantities. Only materialId is ever stored, never
 * the material's name.
 */
export interface PipeItem {
  id: string;
  materialId: string;
  length: number;
  quantity: number;
}

/** A First Fix accessory row. Quantity only - no length, per the spec. */
export interface AccessoryItem {
  id: string;
  materialId: string;
  quantity: number;
}

/** A Second Fix cable row. */
export interface CableItem {
  id: string;
  materialId: string;
  length: number;
  quantity: number;
}

/** Second Fix flexible points - a single quantity, not a list of rows. */
export interface FlexiblePoints {
  quantity: number;
}

/**
 * Where an Estimate currently lives inside the shared Excel workbook.
 * Keyed to the Estimate by id (via the `excelLocation` field below), never
 * by title/name - names can change without breaking the link. Absent until
 * the estimate has been generated into Excel at least once.
 */
export interface EstimateExcelLocation {
  worksheetName: string;
  startRow: number;
  endRow: number;
  lastGeneratedAt: string;
}

/**
 * Mirrors the final worksheet layout directly: firstFixPipes +
 * firstFixAccessories make up the "1st, fix" table, secondFixCables +
 * flexiblePoints make up the "2nd, fix" table. Kept as distinct typed
 * arrays (rather than one generic "lines" list) so the Excel generator (a
 * later phase) can lay out both tables straight from this shape.
 *
 * A project can have unlimited Estimates (see storage.ts's getAllEstimates),
 * so each one carries its own identity/audit fields. grandTotal is set by
 * calculator.ts (see models/Calculation.ts's CalculationResult) whenever the
 * estimate is generated or saved; it stays 0 - shown as "Pending" in the UI -
 * until that has happened at least once.
 */
export interface Estimate {
  id: string;
  title: string;
  firstFixPipes: PipeItem[];
  firstFixAccessories: AccessoryItem[];
  secondFixCables: CableItem[];
  flexiblePoints: FlexiblePoints;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  excelLocation?: EstimateExcelLocation;
}
