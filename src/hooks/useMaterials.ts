import { useCallback, useState } from "react";
import { Material } from "../models/Material";
import { storageService } from "../services/storage";
import { useAppToast } from "./useAppToast";

/**
 * Loads materials from storage once and exposes CRUD helpers that keep
 * storage and local state in sync. UI components stay presentational and
 * never touch storageService directly.
 */
export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>(() => storageService.getMaterials());
  const [isSaving, setIsSaving] = useState(false);
  const toast = useAppToast();

  const persist = useCallback(
    async (next: Material[]) => {
      setIsSaving(true);
      try {
        await storageService.saveMaterials(next);
        setMaterials(next);
        return true;
      } catch {
        toast.error("Failed to Save", "The material list could not be saved. Try again.");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [toast]
  );

  const addMaterial = useCallback(
    async (material: Material) => {
      const ok = await persist([...materials, material]);
      if (ok) {
        toast.success("Material Saved");
      }
      return ok;
    },
    [materials, persist, toast]
  );

  const updateMaterial = useCallback(
    async (updated: Material) => {
      const ok = await persist(materials.map((material) => (material.id === updated.id ? updated : material)));
      if (ok) {
        toast.success("Material Saved");
      }
      return ok;
    },
    [materials, persist, toast]
  );

  const deleteMaterial = useCallback(
    async (id: string) => {
      const ok = await persist(materials.filter((material) => material.id !== id));
      if (ok) {
        toast.success("Material Deleted");
      }
      return ok;
    },
    [materials, persist, toast]
  );

  const isNameTaken = useCallback(
    (name: string, excludeId?: string) =>
      materials.some(
        (material) => material.id !== excludeId && material.name.trim().toLowerCase() === name.trim().toLowerCase()
      ),
    [materials]
  );

  return { materials, isSaving, addMaterial, updateMaterial, deleteMaterial, isNameTaken };
}
