import { useCallback, useState } from "react";
import { Estimate } from "../models/Estimate";
import { storageService } from "../services/storage";
import { toTitleCase } from "../utils/text";
import { useAppToast } from "./useAppToast";
import { useCurrentEstimate } from "../app/CurrentEstimateContext";

/** Owns the "all saved estimates" list used by the Estimates dialog and the My Estimates page - separate from useEstimateBuilder, which only manages the single draft being edited. */
export function useEstimatesList() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  /** id of the estimate currently being renamed or deleted, so only that card's buttons disable - not the whole list. */
  const [busyId, setBusyId] = useState<string | undefined>(undefined);
  const toast = useAppToast();
  const { currentEstimateId, setCurrentEstimateId } = useCurrentEstimate();

  const refresh = useCallback(() => {
    setEstimates(storageService.getAllEstimates());
  }, []);

  const renameEstimate = useCallback(
    async (id: string, title: string) => {
      const existing = storageService.getEstimate(id);
      if (!existing) {
        return;
      }
      const trimmed = title.trim();
      if (!trimmed) {
        return;
      }
      const titleCased = toTitleCase(trimmed);

      setBusyId(id);
      try {
        const updated: Estimate = { ...existing, title: titleCased, updatedAt: new Date().toISOString() };
        await storageService.updateEstimate(updated);
        refresh();
        toast.success("Estimate Renamed");
      } catch {
        toast.error("Failed to Rename", "The estimate could not be renamed. Try again.");
      } finally {
        setBusyId(undefined);
      }
    },
    [refresh, toast]
  );

  const deleteEstimate = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await storageService.deleteEstimate(id);
        refresh();
        if (currentEstimateId === id) {
          setCurrentEstimateId(undefined);
        }
        toast.success("Estimate Deleted");
      } catch {
        toast.error("Failed to Delete", "The estimate could not be deleted. Try again.");
      } finally {
        setBusyId(undefined);
      }
    },
    [refresh, toast, currentEstimateId, setCurrentEstimateId]
  );

  /**
   * Swaps the estimate at `index` with its neighbor at `index + offset`
   * (offset is -1 for up, +1 for down) and persists the new order via
   * replaceAllEstimates. This order is what "Generate All" (and each
   * estimate's own position in the Summary Table) follows, since both read
   * straight off storageService.getAllEstimates().
   */
  const moveEstimate = useCallback(
    async (index: number, offset: -1 | 1) => {
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= estimates.length) {
        return;
      }
      const id = estimates[index].id;
      setBusyId(id);
      try {
        const reordered = [...estimates];
        [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
        await storageService.replaceAllEstimates(reordered);
        refresh();
      } catch {
        toast.error("Failed to Reorder", "The estimate order could not be changed. Try again.");
      } finally {
        setBusyId(undefined);
      }
    },
    [estimates, refresh, toast]
  );

  const moveEstimateUp = useCallback((index: number) => moveEstimate(index, -1), [moveEstimate]);
  const moveEstimateDown = useCallback((index: number) => moveEstimate(index, 1), [moveEstimate]);

  return { estimates, refresh, renameEstimate, deleteEstimate, moveEstimateUp, moveEstimateDown, busyId };
}
