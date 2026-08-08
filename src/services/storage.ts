import { Material } from "../models/Material";
import { ProjectSettings } from "../models/Project";
import { Estimate } from "../models/Estimate";

const MATERIALS_KEY = "electricalEstimator.materials";
const PROJECT_SETTINGS_KEY = "electricalEstimator.projectSettings";
const ESTIMATES_KEY = "electricalEstimator.estimates";

/**
 * Persistence service backed by the Office Storage APIs
 * (Office.context.document.settings), which save into the workbook itself
 * so data survives closing and reopening Excel. Estimates are stored as a
 * single array under one key - a project can have unlimited Estimates.
 */
export interface StorageService {
  getMaterials(): Material[];
  saveMaterials(materials: Material[]): Promise<void>;
  getProjectSettings(): ProjectSettings | undefined;
  saveProjectSettings(settings: ProjectSettings): Promise<void>;
  getAllEstimates(): Estimate[];
  getEstimate(id: string): Estimate | undefined;
  /** Adds a brand new estimate. Throws if an estimate with this id already exists - use updateEstimate instead. */
  saveEstimate(estimate: Estimate): Promise<void>;
  /** Replaces an existing estimate. Throws if no estimate with this id exists yet - use saveEstimate instead. */
  updateEstimate(estimate: Estimate): Promise<void>;
  /** Replaces multiple existing estimates (matched by id) in a single read-modify-write cycle. Estimates not already present are ignored. */
  updateEstimates(estimates: Estimate[]): Promise<void>;
  deleteEstimate(id: string): Promise<void>;
  /** Wholesale replace of the estimate list - used by backup import, unlike updateEstimates which only touches existing ids. */
  replaceAllEstimates(estimates: Estimate[]): Promise<void>;
  /** Clears materials, project settings, and every estimate. Used by Settings' "Reset All Data". */
  resetAll(): Promise<void>;
}

function persistSettings(): Promise<void> {
  return new Promise((resolve, reject) => {
    Office.context.document.settings.saveAsync((result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) {
        resolve();
      } else {
        reject(result.error);
      }
    });
  });
}

function readEstimates(): Estimate[] {
  const stored = Office.context.document.settings.get(ESTIMATES_KEY) as Estimate[] | undefined;
  return stored ?? [];
}

async function writeEstimates(estimates: Estimate[]): Promise<void> {
  Office.context.document.settings.set(ESTIMATES_KEY, estimates);
  await persistSettings();
}

export const storageService: StorageService = {
  getMaterials() {
    const stored = Office.context.document.settings.get(MATERIALS_KEY) as Material[] | undefined;
    return stored ?? [];
  },

  async saveMaterials(materials) {
    Office.context.document.settings.set(MATERIALS_KEY, materials);
    await persistSettings();
  },

  getProjectSettings() {
    return Office.context.document.settings.get(PROJECT_SETTINGS_KEY) as ProjectSettings | undefined;
  },

  async saveProjectSettings(settings) {
    Office.context.document.settings.set(PROJECT_SETTINGS_KEY, settings);
    await persistSettings();
  },

  getAllEstimates() {
    return readEstimates();
  },

  getEstimate(id) {
    return readEstimates().find((estimate) => estimate.id === id);
  },

  async saveEstimate(estimate) {
    const estimates = readEstimates();
    if (estimates.some((existing) => existing.id === estimate.id)) {
      throw new Error(`Estimate ${estimate.id} already exists - use updateEstimate instead.`);
    }
    await writeEstimates([...estimates, estimate]);
  },

  async updateEstimate(estimate) {
    const estimates = readEstimates();
    if (!estimates.some((existing) => existing.id === estimate.id)) {
      throw new Error(`Estimate ${estimate.id} does not exist yet - use saveEstimate instead.`);
    }
    await writeEstimates(estimates.map((existing) => (existing.id === estimate.id ? estimate : existing)));
  },

  async updateEstimates(updates) {
    const estimates = readEstimates();
    const updatesById = new Map(updates.map((estimate) => [estimate.id, estimate]));
    await writeEstimates(estimates.map((existing) => updatesById.get(existing.id) ?? existing));
  },

  async deleteEstimate(id) {
    const estimates = readEstimates();
    await writeEstimates(estimates.filter((estimate) => estimate.id !== id));
  },

  async replaceAllEstimates(estimates) {
    await writeEstimates(estimates);
  },

  async resetAll() {
    Office.context.document.settings.remove(MATERIALS_KEY);
    Office.context.document.settings.remove(PROJECT_SETTINGS_KEY);
    Office.context.document.settings.remove(ESTIMATES_KEY);
    await persistSettings();
  },
};
