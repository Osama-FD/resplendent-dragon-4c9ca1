/**
 * Project-specific pricing for one material. Kept separate from the
 * Material definition so the same material list can be priced differently
 * per project. mpCost only applies when the referenced material has
 * hasMpCost === true.
 */
export interface MaterialPrice {
  materialId: string;
  unitCost: number;
  mpCost?: number;
}

/**
 * Project-level configuration created on the Setup page: identity, OH &
 * Margin percentages (may be zero), the fixed Second Fix MP price, the unit
 * cost applied to Flexible Points, and per-material pricing.
 */
export interface ProjectSettings {
  projectName: string;
  ohPercentage: number;
  marginPercentage: number;
  secondFixMpPrice: number;
  flexiblePointUnitCost: number;
  materialPrices: MaterialPrice[];
}
