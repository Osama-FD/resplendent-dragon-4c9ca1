import { useCallback, useState } from "react";
import { Estimate } from "../models/Estimate";
import { Material } from "../models/Material";
import { ProjectSettings } from "../models/Project";
import { storageService } from "../services/storage";
import { calculatorService } from "../services/calculator";
import { excelService } from "../services/excel";

export type ExcelSyncStatus = "idle" | "syncing" | "done" | "failed";

/**
 * Drives the "single shared worksheet" sync. Loads every saved estimate,
 * runs each through calculator.ts to get a fresh CalculationResult (the
 * only source of computed numbers), hands the pairs to excelService (which
 * only decides layout/formulas/formatting - no calculations), then
 * persists the fresh excelLocation each estimate got back. "Generate All"
 * uses `syncAll` (full rebuild); a single card's "Generate" uses
 * `regenerateOne`, which still loads every estimate (needed to resolve the
 * target's Summary Table row and other estimates' shifted locations) but
 * only rewrites the target's own section in Excel - see services/excel.ts.
 */
export function useExcelSync() {
  const [status, setStatus] = useState<ExcelSyncStatus>("idle");
  /** id of the estimate currently mid-regenerate via regenerateOne, so only that card shows a spinner. */
  const [regeneratingId, setRegeneratingId] = useState<string | undefined>(undefined);

  /** Returns the freshly-synced estimates (with updated excelLocation) on success, undefined on failure. */
  const syncAll = useCallback(
    async (materials: Material[], settings: ProjectSettings): Promise<Estimate[] | undefined> => {
      setStatus("syncing");
      try {
        const estimates = storageService.getAllEstimates();
        const items = estimates.map((estimate) => ({
          estimate,
          result: calculatorService.calculate(estimate, settings),
        }));

        const updated = await excelService.syncAllEstimates(
          items,
          materials,
          settings.ohPercentage,
          settings.marginPercentage
        );
        await storageService.updateEstimates(updated);

        setStatus("done");
        return updated;
      } catch {
        setStatus("failed");
        return undefined;
      }
    },
    []
  );

  /** Regenerates only `id`'s section in Excel, updates the Summary Table row for it, and leaves every other estimate untouched. */
  const regenerateOne = useCallback(
    async (id: string, materials: Material[], settings: ProjectSettings): Promise<Estimate[] | undefined> => {
      setRegeneratingId(id);
      try {
        const estimates = storageService.getAllEstimates();
        const items = estimates.map((estimate) => ({
          estimate,
          result: calculatorService.calculate(estimate, settings),
        }));

        const updated = await excelService.regenerateEstimate(
          items,
          id,
          materials,
          settings.ohPercentage,
          settings.marginPercentage
        );
        await storageService.updateEstimates(updated);

        return updated;
      } catch {
        return undefined;
      } finally {
        setRegeneratingId(undefined);
      }
    },
    []
  );

  return { status, syncAll, regenerateOne, regeneratingId };
}
