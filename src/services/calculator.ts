import { Estimate } from "../models/Estimate";
import { MaterialPrice, ProjectSettings } from "../models/Project";
import {
  CalculatedAccessoryLine,
  CalculatedCableLine,
  CalculatedPipeLine,
  CalculationResult,
} from "../models/Calculation";

/**
 * Pure cost-calculation service. Every formula in the spec lives here and
 * only here - nowhere else in the app computes a cost, so there is a single
 * source of truth. Kept separate from Excel/UI so it can be unit tested in
 * isolation.
 */
export interface CalculatorService {
  calculate(estimate: Estimate, settings: ProjectSettings): CalculationResult;
}

function findMaterialPrice(materialId: string, settings: ProjectSettings): MaterialPrice {
  return (
    settings.materialPrices.find((price) => price.materialId === materialId) ?? {
      materialId,
      unitCost: 0,
      mpCost: 0,
    }
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export const calculatorService: CalculatorService = {
  calculate(estimate, settings) {
    const pipes: CalculatedPipeLine[] = estimate.firstFixPipes.map((item) => {
      const price = findMaterialPrice(item.materialId, settings);
      const unitCost = price.unitCost;
      const mpCost = price.mpCost ?? 0;
      // Pipe Cost = Length × Quantity × Unit Cost
      const cost = item.length * item.quantity * unitCost;
      // Pipe MP = Length × Quantity × Pipe MP Cost
      const mp = item.length * item.quantity * mpCost;
      return {
        id: item.id,
        materialId: item.materialId,
        length: item.length,
        quantity: item.quantity,
        unitCost,
        mpCost,
        cost,
        mp,
        rowTotal: cost + mp,
      };
    });

    const accessories: CalculatedAccessoryLine[] = estimate.firstFixAccessories.map((item) => {
      const unitCost = findMaterialPrice(item.materialId, settings).unitCost;
      return {
        id: item.id,
        materialId: item.materialId,
        quantity: item.quantity,
        unitCost,
        // Accessory Cost = Quantity × Unit Cost
        cost: item.quantity * unitCost,
      };
    });

    const cables: CalculatedCableLine[] = estimate.secondFixCables.map((item) => {
      const unitCost = findMaterialPrice(item.materialId, settings).unitCost;
      // Cable Cost = Length × Quantity × Unit Cost
      const cost = item.length * item.quantity * unitCost;
      // Second Fix MP (per row) = Length × Quantity × Second Fix MP Price - unitCost is not used here.
      const mp = item.length * item.quantity * settings.secondFixMpPrice;
      return {
        id: item.id,
        materialId: item.materialId,
        length: item.length,
        quantity: item.quantity,
        unitCost,
        secondFixMpRate: settings.secondFixMpPrice,
        cost,
        mp,
        rowTotal: cost + mp,
      };
    });

    const pipeCosts = sum(pipes.map((line) => line.cost));
    const pipeMp = sum(pipes.map((line) => line.mp));
    const accessoryCosts = sum(accessories.map((line) => line.cost));
    const cableCosts = sum(cables.map((line) => line.cost));

    const flexiblePointQuantity = estimate.flexiblePoints.quantity;
    const flexiblePointUnitCost = settings.flexiblePointUnitCost;
    // Flexible Point Cost = Quantity × Unit Cost
    const flexiblePointCost = flexiblePointQuantity * flexiblePointUnitCost;
    // Second Fix MP Total = Σ (Length × Quantity × Second Fix MP Price) across all cable rows
    const secondFixMp = sum(cables.map((line) => line.mp));

    // First Fix Total = Pipe Costs + Pipe MP + Accessories
    const firstFixTotal = pipeCosts + pipeMp + accessoryCosts;
    // Second Fix Total = Cable Costs + Flexible Point Cost + Second Fix MP
    const secondFixTotal = cableCosts + flexiblePointCost + secondFixMp;
    // Total Price = First Fix Total + Second Fix Total
    const totalPrice = firstFixTotal + secondFixTotal;
    // OH Amount = Total Price × OH %
    const ohAmount = totalPrice * (settings.ohPercentage / 100);
    // Total With OH = Total Price + OH Amount
    const totalWithOh = totalPrice + ohAmount;
    // Margin Amount = Total With OH × Margin %
    const marginAmount = totalWithOh * (settings.marginPercentage / 100);
    // Grand Total = Total With OH + Margin Amount
    const grandTotal = totalWithOh + marginAmount;

    return {
      pipes,
      cables,
      accessories,
      flexiblePoints: {
        quantity: flexiblePointQuantity,
        unitCost: flexiblePointUnitCost,
        cost: flexiblePointCost,
      },
      pipeCosts,
      pipeMp,
      accessoryCosts,
      cableCosts,
      flexiblePointCost,
      secondFixMp,
      firstFixTotal,
      secondFixTotal,
      totalPrice,
      ohAmount,
      totalWithOh,
      marginAmount,
      grandTotal,
    };
  },
};
