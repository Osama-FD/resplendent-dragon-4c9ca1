/** One First Fix pipe row with its priced cost and First Fix MP contribution. */
export interface CalculatedPipeLine {
  id: string;
  materialId: string;
  length: number;
  quantity: number;
  unitCost: number;
  mpCost: number;
  /** Length × Quantity × Unit Cost */
  cost: number;
  /** Length × Quantity × Pipe MP Cost */
  mp: number;
  /** cost + mp - the Preview's "Row Total" column. Display-only sum, not a new formula. */
  rowTotal: number;
}

/** One Second Fix cable row with its priced cost and Second Fix MP contribution. */
export interface CalculatedCableLine {
  id: string;
  materialId: string;
  length: number;
  quantity: number;
  unitCost: number;
  /** The project's Second Fix MP Price, carried per row for display next to Unit Cost. */
  secondFixMpRate: number;
  /** Length × Quantity × Unit Cost */
  cost: number;
  /** Length × Quantity × Second Fix MP Price - does NOT use unitCost. */
  mp: number;
  /** cost + mp - the Preview's "Row Total" column. Display-only sum, not a new formula. */
  rowTotal: number;
}

/** One First Fix accessory row with its priced cost. */
export interface CalculatedAccessoryLine {
  id: string;
  materialId: string;
  quantity: number;
  unitCost: number;
  /** Quantity × Unit Cost */
  cost: number;
}

/** Flexible Points priced out - a single quantity, not a list of rows. */
export interface CalculatedFlexiblePoints {
  quantity: number;
  unitCost: number;
  /** Quantity × Unit Cost */
  cost: number;
}

/**
 * Full, strongly typed output of calculator.ts for one Estimate +
 * ProjectSettings pair. Line-level figures are included so a Preview page
 * can show an itemized breakdown; every aggregate below is derived purely
 * from those lines. The formulas themselves live only in calculator.ts.
 */
export interface CalculationResult {
  pipes: CalculatedPipeLine[];
  cables: CalculatedCableLine[];
  accessories: CalculatedAccessoryLine[];
  flexiblePoints: CalculatedFlexiblePoints;

  pipeCosts: number;
  pipeMp: number;
  accessoryCosts: number;
  cableCosts: number;
  flexiblePointCost: number;
  secondFixMp: number;

  firstFixTotal: number;
  secondFixTotal: number;
  totalPrice: number;
  ohAmount: number;
  totalWithOh: number;
  marginAmount: number;
  grandTotal: number;
}
