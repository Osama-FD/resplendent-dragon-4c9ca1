import * as React from "react";
import { Field, Input, Text, Button, MessageBar, MessageBarBody, makeStyles, tokens } from "@fluentui/react-components";
import { PageShell } from "../PageShell";
import { MaterialLineTable } from "./MaterialLineTable";
import { EstimatesDialog } from "./EstimatesDialog";
import { CalculationPreviewDialog } from "./CalculationPreviewDialog";
import { useMaterials } from "../../hooks/useMaterials";
import { useEstimateBuilder } from "../../hooks/useEstimateBuilder";
import { useProjectSettings } from "../../hooks/useProjectSettings";
import { useExcelSync } from "../../hooks/useExcelSync";
import { useAppToast } from "../../hooks/useAppToast";
import { excelService } from "../../services/excel";
import { parseNumericInput } from "../../utils/number";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXL,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  errorList: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
});

/** Pulls the row id out of an error field like "pipes.<id>.material" - undefined for non-row errors (e.g. "title"). */
function rowIdFromErrorField(field: string): string | undefined {
  const parts = field.split(".");
  return parts.length >= 2 ? parts[1] : undefined;
}

/**
 * Estimate Builder: title + First Fix Pipes / First Fix Accessories /
 * Second Fix Cables / Flexible Points, mirroring the final worksheet
 * layout. Material pickers are sourced live from Material Manager
 * (useMaterials) - nothing is hardcoded. Generate/Save validate, build the
 * Estimate, and run it through calculator.ts; a Preview dialog shows the
 * resulting breakdown. "Generate Excel" (inside the Preview) saves this
 * estimate, syncs every saved estimate into the single shared "Estimates"
 * worksheet via useExcelSync, then jumps Excel straight to this estimate's
 * section. A project can have unlimited Estimates - "My Estimates" opens a
 * dialog to browse/open/rename/delete saved ones (loading one back into
 * this builder for editing).
 */
export const NewEstimate: React.FC = () => {
  const styles = useStyles();
  const { materials } = useMaterials();
  const { settings } = useProjectSettings();
  const builder = useEstimateBuilder();
  const excelSync = useExcelSync();
  const toast = useAppToast();
  const [estimatesDialogOpen, setEstimatesDialogOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const titleFieldRef = React.useRef<HTMLInputElement>(null);

  const pipeMaterials = React.useMemo(() => materials.filter((material) => material.category === "Pipe"), [materials]);
  const cableMaterials = React.useMemo(() => materials.filter((material) => material.category === "Cable"), [materials]);
  const accessoryMaterials = React.useMemo(
    () => materials.filter((material) => material.category === "Accessory"),
    [materials]
  );

  const isDefined = (value: string | undefined): value is string => value !== undefined;

  const invalidPipeRowIds = React.useMemo(
    () =>
      new Set(
        builder.errors.filter((e) => e.field.startsWith("pipes.")).map((e) => rowIdFromErrorField(e.field)).filter(isDefined)
      ),
    [builder.errors]
  );
  const invalidAccessoryRowIds = React.useMemo(
    () =>
      new Set(
        builder.errors
          .filter((e) => e.field.startsWith("accessories."))
          .map((e) => rowIdFromErrorField(e.field))
          .filter(isDefined)
      ),
    [builder.errors]
  );
  const invalidCableRowIds = React.useMemo(
    () =>
      new Set(
        builder.errors.filter((e) => e.field.startsWith("cables.")).map((e) => rowIdFromErrorField(e.field)).filter(isDefined)
      ),
    [builder.errors]
  );

  /** Scrolls to and focuses the first invalid field/row, so long forms don't leave the user hunting for the problem. */
  const focusFirstError = (errors: { field: string }[]) => {
    const first = errors[0];
    if (!first) {
      return;
    }
    if (first.field === "title") {
      titleFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      titleFieldRef.current?.focus();
      return;
    }
    const rowId = rowIdFromErrorField(first.field);
    if (!rowId) {
      return;
    }
    const rowElement = document.querySelector(`[data-row-id="${rowId}"]`);
    rowElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    (rowElement?.querySelector("select, input") as HTMLElement | null)?.focus();
  };

  const handleGenerate = () => {
    const estimate = builder.generateEstimate();
    if (estimate) {
      setPreviewOpen(true);
    } else {
      focusFirstError(builder.errors);
    }
  };

  const handleSave = async () => {
    const saved = await builder.saveEstimate();
    if (saved) {
      setPreviewOpen(true);
    } else {
      focusFirstError(builder.errors);
    }
  };

  const handleGenerateExcel = async () => {
    // The shared workbook sync reads every saved estimate from storage, so
    // this one must be persisted first or it wouldn't be included.
    const saved = await builder.saveEstimate();
    if (!saved) {
      focusFirstError(builder.errors);
      return;
    }
    const updatedEstimates = await excelSync.syncAll(materials, settings);
    if (!updatedEstimates) {
      toast.error("Failed to Generate Excel", "The workbook could not be synced. Try again.");
      return;
    }
    toast.success("Excel Generated Successfully");

    // Jump Excel straight to this estimate's section once it's synced.
    const justSynced = updatedEstimates.find((estimate) => estimate.id === saved.id);
    if (justSynced?.excelLocation) {
      try {
        await excelService.openEstimateInExcel(justSynced);
      } catch {
        // Non-fatal - the workbook is still correctly generated even if the jump-to fails.
      }
    }
  };

  return (
    <PageShell title="New Estimate" description="Build an estimate from your priced materials.">
      <div className={styles.page}>
        <Field
          label="Estimate Title"
          required
          validationState={builder.errors.some((e) => e.field === "title") ? "error" : "none"}
          validationMessage={builder.errors.find((e) => e.field === "title")?.message}
        >
          <Input
            ref={titleFieldRef}
            value={builder.title}
            onChange={(_, data) => builder.setTitle(data.value)}
            placeholder='e.g. "General Extract Fan (EMT)"'
          />
        </Field>

        <div className={styles.section}>
          <Text className={styles.sectionTitle}>First Fix Pipes</Text>
          <MaterialLineTable
            materials={pipeMaterials}
            materialColumnLabel="Pipe"
            rows={builder.firstFixPipes}
            showLength
            addButtonLabel="+ Add Pipe"
            emptyMessage="No Pipes Added"
            invalidRowIds={invalidPipeRowIds}
            onAdd={() => builder.addPipe(pipeMaterials[0]?.id ?? "")}
            onUpdate={builder.updatePipe}
            onRemove={builder.removePipe}
          />
        </div>

        <div className={styles.section}>
          <Text className={styles.sectionTitle}>First Fix Accessories</Text>
          <MaterialLineTable
            materials={accessoryMaterials}
            materialColumnLabel="Accessory"
            rows={builder.firstFixAccessories}
            showLength={false}
            addButtonLabel="+ Add Accessory"
            emptyMessage="No Accessories Added"
            invalidRowIds={invalidAccessoryRowIds}
            onAdd={() => builder.addAccessory(accessoryMaterials[0]?.id ?? "")}
            onUpdate={builder.updateAccessory}
            onRemove={builder.removeAccessory}
          />
        </div>

        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Second Fix Cables</Text>
          <MaterialLineTable
            materials={cableMaterials}
            materialColumnLabel="Cable"
            rows={builder.secondFixCables}
            showLength
            addButtonLabel="+ Add Cable"
            emptyMessage="No Cables Added"
            invalidRowIds={invalidCableRowIds}
            onAdd={() => builder.addCable(cableMaterials[0]?.id ?? "")}
            onUpdate={builder.updateCable}
            onRemove={builder.removeCable}
          />
        </div>

        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Flexible Points</Text>
          <Field label="Quantity">
            <Input
              type="number"
              value={String(builder.flexiblePointsQuantity)}
              onChange={(_, data) => builder.setFlexiblePointsQuantity(parseNumericInput(data.value))}
            />
          </Field>
        </div>

        {builder.errors.length > 0 && (
          <MessageBar intent="error">
            <MessageBarBody>
              <ul className={styles.errorList}>
                {builder.errors.map((error) => (
                  <li key={error.field}>{error.message}</li>
                ))}
              </ul>
            </MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.actions}>
          <Button appearance="secondary" onClick={() => builder.newEstimate()}>
            New Estimate
          </Button>
          <Button appearance="primary" onClick={handleGenerate}>
            Generate Estimate
          </Button>
          <Button appearance="secondary" disabled={builder.isSaving} onClick={handleSave}>
            {builder.isSaving ? "Saving..." : "Save Estimate"}
          </Button>
          <Button
            appearance="secondary"
            disabled={!builder.calculationResult}
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button appearance="secondary" onClick={() => setEstimatesDialogOpen(true)}>
            My Estimates
          </Button>
        </div>
      </div>

      <EstimatesDialog
        open={estimatesDialogOpen}
        onOpenChange={setEstimatesDialogOpen}
        onOpenEstimate={(id) => builder.openEstimate(id)}
      />

      <CalculationPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={builder.title}
        result={builder.calculationResult}
        materials={materials}
        ohPercentage={settings.ohPercentage}
        marginPercentage={settings.marginPercentage}
        onGenerateExcel={handleGenerateExcel}
        generateStatus={excelSync.status}
      />
    </PageShell>
  );
};
