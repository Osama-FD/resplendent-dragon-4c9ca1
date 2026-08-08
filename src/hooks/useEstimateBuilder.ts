import { useCallback, useState } from "react";
import { AccessoryItem, CableItem, Estimate, PipeItem } from "../models/Estimate";
import { CalculationResult } from "../models/Calculation";
import { generateId } from "../utils/id";
import { toTitleCase } from "../utils/text";
import { storageService } from "../services/storage";
import { calculatorService } from "../services/calculator";
import { useProjectSettings } from "./useProjectSettings";
import { useAppToast } from "./useAppToast";
import { useCurrentEstimate } from "../app/CurrentEstimateContext";

interface EstimateBuilderState {
  id: string;
  title: string;
  firstFixPipes: PipeItem[];
  firstFixAccessories: AccessoryItem[];
  secondFixCables: CableItem[];
  flexiblePointsQuantity: number;
  /** Set once this draft has been saved at least once; undefined means it only exists in-memory so far. */
  createdAt?: string;
}

function emptyState(): EstimateBuilderState {
  return {
    id: generateId(),
    title: "",
    firstFixPipes: [],
    firstFixAccessories: [],
    secondFixCables: [],
    flexiblePointsQuantity: 0,
    createdAt: undefined,
  };
}

function stateFromEstimate(estimate: Estimate): EstimateBuilderState {
  return {
    id: estimate.id,
    title: estimate.title,
    firstFixPipes: estimate.firstFixPipes,
    firstFixAccessories: estimate.firstFixAccessories,
    secondFixCables: estimate.secondFixCables,
    flexiblePointsQuantity: estimate.flexiblePoints.quantity,
    createdAt: estimate.createdAt,
  };
}

export interface EstimateValidationError {
  field: string;
  message: string;
}

/**
 * Owns the single Estimate currently being edited: form state, row CRUD,
 * validation, save/open/new, and running the calculator. A project can
 * have unlimited Estimates (see useEstimatesList for the saved-estimates
 * list) - this hook only cares about the one open in the builder right
 * now. Generate/Save validate, build the Estimate object, and run
 * calculator.ts against it (storing the CalculationResult + grandTotal);
 * no Excel calls or worksheet generation happen here.
 */
export function useEstimateBuilder() {
  const [state, setState] = useState<EstimateBuilderState>(emptyState);
  const [errors, setErrors] = useState<EstimateValidationError[]>([]);
  const [builtEstimate, setBuiltEstimate] = useState<Estimate | undefined>(undefined);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | undefined>(undefined);
  const [openStatus, setOpenStatus] = useState<"idle" | "not-found">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const { settings } = useProjectSettings();
  const toast = useAppToast();
  const { setCurrentEstimateId } = useCurrentEstimate();

  const setTitle = useCallback((title: string) => setState((s) => ({ ...s, title })), []);

  const addPipe = useCallback((materialId: string) => {
    setState((s) => ({
      ...s,
      firstFixPipes: [...s.firstFixPipes, { id: generateId(), materialId, length: 0, quantity: 1 }],
    }));
  }, []);
  const updatePipe = useCallback((id: string, patch: Partial<Omit<PipeItem, "id">>) => {
    setState((s) => ({
      ...s,
      firstFixPipes: s.firstFixPipes.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  }, []);
  const removePipe = useCallback((id: string) => {
    setState((s) => ({ ...s, firstFixPipes: s.firstFixPipes.filter((line) => line.id !== id) }));
  }, []);

  const addCable = useCallback((materialId: string) => {
    setState((s) => ({
      ...s,
      secondFixCables: [...s.secondFixCables, { id: generateId(), materialId, length: 0, quantity: 1 }],
    }));
  }, []);
  const updateCable = useCallback((id: string, patch: Partial<Omit<CableItem, "id">>) => {
    setState((s) => ({
      ...s,
      secondFixCables: s.secondFixCables.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  }, []);
  const removeCable = useCallback((id: string) => {
    setState((s) => ({ ...s, secondFixCables: s.secondFixCables.filter((line) => line.id !== id) }));
  }, []);

  const addAccessory = useCallback((materialId: string) => {
    setState((s) => ({
      ...s,
      firstFixAccessories: [...s.firstFixAccessories, { id: generateId(), materialId, quantity: 1 }],
    }));
  }, []);
  const updateAccessory = useCallback((id: string, patch: Partial<Omit<AccessoryItem, "id">>) => {
    setState((s) => ({
      ...s,
      firstFixAccessories: s.firstFixAccessories.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    }));
  }, []);
  const removeAccessory = useCallback((id: string) => {
    setState((s) => ({ ...s, firstFixAccessories: s.firstFixAccessories.filter((line) => line.id !== id) }));
  }, []);

  const setFlexiblePointsQuantity = useCallback((flexiblePointsQuantity: number) => {
    setState((s) => ({ ...s, flexiblePointsQuantity }));
  }, []);

  const validate = useCallback((current: EstimateBuilderState): EstimateValidationError[] => {
    const validationErrors: EstimateValidationError[] = [];

    if (!current.title.trim()) {
      validationErrors.push({ field: "title", message: "Estimate title is required." });
    }

    current.firstFixPipes.forEach((line, index) => {
      if (!line.materialId) {
        validationErrors.push({ field: `pipes.${line.id}.material`, message: `Select a pipe for First Fix Pipes row ${index + 1}.` });
      }
      if (line.length < 0) {
        validationErrors.push({ field: `pipes.${line.id}.length`, message: `Length must be 0 or greater for First Fix Pipes row ${index + 1}.` });
      }
      if (!(line.quantity > 0)) {
        validationErrors.push({ field: `pipes.${line.id}.quantity`, message: `Quantity must be greater than 0 for First Fix Pipes row ${index + 1}.` });
      }
    });

    current.firstFixAccessories.forEach((line, index) => {
      if (!line.materialId) {
        validationErrors.push({ field: `accessories.${line.id}.material`, message: `Select an accessory for First Fix Accessories row ${index + 1}.` });
      }
      if (!(line.quantity > 0)) {
        validationErrors.push({ field: `accessories.${line.id}.quantity`, message: `Quantity must be greater than 0 for First Fix Accessories row ${index + 1}.` });
      }
    });

    current.secondFixCables.forEach((line, index) => {
      if (!line.materialId) {
        validationErrors.push({ field: `cables.${line.id}.material`, message: `Select a cable for Second Fix row ${index + 1}.` });
      }
      if (line.length < 0) {
        validationErrors.push({ field: `cables.${line.id}.length`, message: `Length must be 0 or greater for Second Fix row ${index + 1}.` });
      }
      if (!(line.quantity > 0)) {
        validationErrors.push({ field: `cables.${line.id}.quantity`, message: `Quantity must be greater than 0 for Second Fix row ${index + 1}.` });
      }
    });

    return validationErrors;
  }, []);

  const buildEstimate = useCallback(
    (current: EstimateBuilderState, timestamp: string, grandTotal: number): Estimate => {
      return {
        id: current.id,
        title: toTitleCase(current.title),
        firstFixPipes: current.firstFixPipes,
        firstFixAccessories: current.firstFixAccessories,
        secondFixCables: current.secondFixCables,
        flexiblePoints: { quantity: current.flexiblePointsQuantity },
        grandTotal,
        createdAt: current.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
    },
    []
  );

  /**
   * Validates, builds an Estimate object, runs it through calculator.ts,
   * and stores the CalculationResult (for the Preview) plus the resulting
   * grandTotal on the Estimate. In-memory only - does not touch storage.
   */
  const generateEstimate = useCallback((): Estimate | undefined => {
    const validationErrors = validate(state);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      setBuiltEstimate(undefined);
      setCalculationResult(undefined);
      return undefined;
    }

    const draft = buildEstimate(state, new Date().toISOString(), 0);
    const result = calculatorService.calculate(draft, settings);
    const estimate = { ...draft, grandTotal: result.grandTotal };

    setState((s) => ({ ...s, title: estimate.title }));
    setCalculationResult(result);
    setBuiltEstimate(estimate);
    setCurrentEstimateId(estimate.id);
    toast.success("Calculation Updated");
    return estimate;
  }, [state, validate, buildEstimate, settings, setCurrentEstimateId, toast]);

  /**
   * Validates, runs the calculator, then creates (first save) or updates
   * (subsequent saves) this draft in storage with the computed grandTotal.
   * Returns the saved Estimate (undefined on failure) rather than just a
   * boolean, so callers that need the fresh id/timestamps right away (e.g.
   * to open it in Excel next) don't have to rely on `builtEstimate` from
   * their own render, which can still be stale immediately after this
   * resolves.
   */
  const saveEstimate = useCallback(async (): Promise<Estimate | undefined> => {
    const validationErrors = validate(state);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      setBuiltEstimate(undefined);
      setCalculationResult(undefined);
      return undefined;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const draft = buildEstimate(state, now, 0);
      const result = calculatorService.calculate(draft, settings);
      const estimate = { ...draft, grandTotal: result.grandTotal };
      const isFirstSave = !state.createdAt;

      if (isFirstSave) {
        await storageService.saveEstimate(estimate);
      } else {
        await storageService.updateEstimate(estimate);
      }

      setState((s) => ({ ...s, createdAt: estimate.createdAt, title: estimate.title }));
      setCalculationResult(result);
      setBuiltEstimate(estimate);
      setCurrentEstimateId(estimate.id);
      toast.success("Estimate Saved");
      return estimate;
    } catch {
      toast.error("Failed to Save", "The estimate could not be saved. Try again.");
      return undefined;
    } finally {
      setIsSaving(false);
    }
  }, [state, validate, buildEstimate, settings, setCurrentEstimateId, toast]);

  /** Loads a previously saved estimate into the builder for editing. */
  const openEstimate = useCallback(
    (id: string): boolean => {
      const saved = storageService.getEstimate(id);
      if (!saved) {
        setOpenStatus("not-found");
        return false;
      }

      setState(stateFromEstimate(saved));
      setBuiltEstimate(saved);
      setCalculationResult(undefined);
      setErrors([]);
      setOpenStatus("idle");
      setCurrentEstimateId(saved.id);
      return true;
    },
    [setCurrentEstimateId]
  );

  /** Clears the builder to start a brand new, unsaved estimate. */
  const newEstimate = useCallback(() => {
    setState(emptyState());
    setBuiltEstimate(undefined);
    setCalculationResult(undefined);
    setErrors([]);
    setOpenStatus("idle");
    setCurrentEstimateId(undefined);
  }, [setCurrentEstimateId]);

  return {
    title: state.title,
    setTitle,
    firstFixPipes: state.firstFixPipes,
    addPipe,
    updatePipe,
    removePipe,
    secondFixCables: state.secondFixCables,
    addCable,
    updateCable,
    removeCable,
    firstFixAccessories: state.firstFixAccessories,
    addAccessory,
    updateAccessory,
    removeAccessory,
    flexiblePointsQuantity: state.flexiblePointsQuantity,
    setFlexiblePointsQuantity,
    errors,
    builtEstimate,
    calculationResult,
    isPersisted: state.createdAt !== undefined,
    isSaving,
    generateEstimate,
    saveEstimate,
    openEstimate,
    newEstimate,
    openStatus,
  };
}
