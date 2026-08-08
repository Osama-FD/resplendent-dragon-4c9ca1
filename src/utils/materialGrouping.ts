import { Material, MaterialCategory } from "../models/Material";

/** Single source of truth for category display order/labels - Material Manager and Setup both use this. */
const CATEGORY_GROUPS: { category: MaterialCategory; label: string }[] = [
  { category: "Pipe", label: "Pipes" },
  { category: "Cable", label: "Cables" },
  { category: "Accessory", label: "Accessories" },
];

export interface MaterialGroup {
  label: string;
  materials: Material[];
}

/** Splits a material list into Pipes/Cables/Accessories groups, in that order. Empty groups are still returned - callers decide whether to skip them. */
export function groupMaterialsByCategory(materials: Material[]): MaterialGroup[] {
  return CATEGORY_GROUPS.map(({ category, label }) => ({
    label,
    materials: materials.filter((material) => material.category === category),
  }));
}
