import { CalculationResult } from "../models/Calculation";
import { Material } from "../models/Material";

const RULE = "----------------------------------------";

function money(value: number): string {
  return value.toFixed(2);
}

function materialName(materials: Material[], materialId: string): string {
  return materials.find((material) => material.id === materialId)?.name ?? "(unknown material)";
}

/**
 * Builds a plain-text version of a Calculation Preview, for pasting
 * alongside the original Excel sheet to verify every row and total by eye.
 * Reads only from CalculationResult (plus title/materials/percentages for
 * labels) - performs no calculations of its own.
 */
export function buildCalculationReport(
  title: string,
  result: CalculationResult,
  materials: Material[],
  ohPercentage: number,
  marginPercentage: number
): string {
  const lines: string[] = [];

  lines.push(RULE, title || "(untitled estimate)", RULE, "");

  lines.push("FIRST FIX", "");
  result.pipes.forEach((line) => {
    lines.push(materialName(materials, line.materialId));
    lines.push(`${line.length} x ${line.quantity}`);
    lines.push(`Unit Cost: ${money(line.unitCost)}  Pipe MP Cost: ${money(line.mpCost)}`);
    lines.push(`Cost: ${money(line.cost)}`);
    lines.push(`MP: ${money(line.mp)}`);
    lines.push(`Row Total: ${money(line.rowTotal)}`, "");
  });
  result.accessories.forEach((line) => {
    lines.push(materialName(materials, line.materialId));
    lines.push(`Qty: ${line.quantity}  Unit Cost: ${money(line.unitCost)}`);
    lines.push(`Total: ${money(line.cost)}`, "");
  });
  lines.push("Pipe Cost Total:", money(result.pipeCosts));
  lines.push("Pipe MP Total:", money(result.pipeMp));
  lines.push("Accessories Total:", money(result.accessoryCosts));
  lines.push("First Fix Total:", money(result.firstFixTotal), "");

  lines.push(RULE, "");
  lines.push("SECOND FIX", "");
  result.cables.forEach((line) => {
    lines.push(materialName(materials, line.materialId));
    lines.push(`${line.length} x ${line.quantity}`);
    lines.push(`Unit Cost: ${money(line.unitCost)}  Second Fix MP: ${money(line.secondFixMpRate)}`);
    lines.push(`Cost: ${money(line.cost)}`);
    lines.push(`MP: ${money(line.mp)}`);
    lines.push(`Row Total: ${money(line.rowTotal)}`, "");
  });
  lines.push("Flexible Point");
  lines.push(`Qty: ${result.flexiblePoints.quantity}  Unit Cost: ${money(result.flexiblePoints.unitCost)}`);
  lines.push(`Total: ${money(result.flexiblePoints.cost)}`, "");
  lines.push("Cable Total:", money(result.cableCosts));
  lines.push("Flexible Point Total:", money(result.flexiblePointCost));
  lines.push("Second Fix MP Total:", money(result.secondFixMp));
  lines.push("Second Fix Total:", money(result.secondFixTotal), "");

  lines.push(RULE, "");
  lines.push("SUMMARY", "");
  lines.push("Total Price:", money(result.totalPrice));
  lines.push(`OH % (${ohPercentage}%):`, money(result.ohAmount));
  lines.push("Total With OH:", money(result.totalWithOh));
  lines.push(`Margin % (${marginPercentage}%):`, money(result.marginAmount));
  lines.push("Grand Total:", money(result.grandTotal));
  lines.push(RULE);

  return lines.join("\n");
}
