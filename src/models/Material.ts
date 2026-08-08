/**
 * Categories a material can belong to. Kept as a union rather than a free
 * string so the UI can render category-specific pickers/formulas safely.
 */
export type MaterialCategory = "Pipe" | "Cable" | "Accessory";

/** Unit a material's length/quantity is measured in. */
export type MaterialUnit = "m" | "pcs";

/**
 * A material definition, owned by Material Manager. Materials carry no
 * pricing - unit cost and MP cost are project-specific and live on
 * ProjectSettings.materialPrices, keyed by material id. This lets the same
 * material be reused across projects with different prices.
 *
 * hasMpCost is only ever true for Pipe materials; Cable and Accessory never
 * carry a First Fix MP price.
 */
export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  hasMpCost: boolean;
}
