import { useCallback, useRef, useState } from "react";
import { MaterialPrice, ProjectSettings } from "../models/Project";
import { storageService } from "../services/storage";
import { debounce } from "../utils/debounce";

const DEFAULT_SETTINGS: ProjectSettings = {
  projectName: "",
  ohPercentage: 0,
  marginPercentage: 0,
  secondFixMpPrice: 0,
  flexiblePointUnitCost: 0,
  materialPrices: [],
};

const AUTOSAVE_DELAY_MS = 500;

/**
 * Loads project settings once and autosaves (debounced) on every change, so
 * Setup page fields persist without an explicit save action. Merges over
 * DEFAULT_SETTINGS so settings saved before a new field existed (e.g.
 * flexiblePointUnitCost) still load with a sane default instead of undefined.
 */
export function useProjectSettings() {
  const [settings, setSettings] = useState<ProjectSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...storageService.getProjectSettings(),
  }));

  const debouncedSave = useRef(
    debounce((next: ProjectSettings) => {
      void storageService.saveProjectSettings(next);
    }, AUTOSAVE_DELAY_MS)
  ).current;

  const updateSettings = useCallback(
    (updater: (current: ProjectSettings) => ProjectSettings) => {
      setSettings((current) => {
        const next = updater(current);
        debouncedSave(next);
        return next;
      });
    },
    [debouncedSave]
  );

  const getMaterialPrice = useCallback(
    (materialId: string): MaterialPrice =>
      settings.materialPrices.find((price) => price.materialId === materialId) ?? {
        materialId,
        unitCost: 0,
        mpCost: 0,
      },
    [settings.materialPrices]
  );

  const setMaterialPrice = useCallback(
    (materialId: string, patch: Partial<Omit<MaterialPrice, "materialId">>) => {
      updateSettings((current) => {
        const existing = current.materialPrices.find((price) => price.materialId === materialId);
        const updated: MaterialPrice = { materialId, unitCost: 0, mpCost: 0, ...existing, ...patch };
        const materialPrices = existing
          ? current.materialPrices.map((price) => (price.materialId === materialId ? updated : price))
          : [...current.materialPrices, updated];
        return { ...current, materialPrices };
      });
    },
    [updateSettings]
  );

  return { settings, updateSettings, getMaterialPrice, setMaterialPrice };
}
