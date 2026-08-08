import * as React from "react";
import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";
import { DocumentTable24Regular } from "@fluentui/react-icons";
import { PageShell } from "../PageShell";
import { EstimateCard } from "../NewEstimate/EstimateCard";
import { useEstimatesList } from "../../hooks/useEstimatesList";
import { useMaterials } from "../../hooks/useMaterials";
import { useProjectSettings } from "../../hooks/useProjectSettings";
import { useExcelSync } from "../../hooks/useExcelSync";
import { useAppToast } from "../../hooks/useAppToast";
import { useCurrentEstimate } from "../../app/CurrentEstimateContext";
import { excelService } from "../../services/excel";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalXXL,
    textAlign: "center",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
});

/**
 * Full-page view of every saved Estimate, reusing the same EstimateCard the
 * New Estimate page's dialog uses - but here "Open" jumps straight to that
 * estimate's section inside the shared Excel workbook (openEstimateInExcel)
 * instead of loading it into the builder for editing. "Generate All
 * Estimates" rebuilds the whole shared worksheet from every saved estimate
 * in one pass via useExcelSync - the same sync path a single "Generate"
 * uses, just triggered directly rather than after saving one estimate.
 */
export const MyEstimates: React.FC = () => {
  const styles = useStyles();
  const { estimates, refresh, renameEstimate, deleteEstimate, moveEstimateUp, moveEstimateDown, busyId } =
    useEstimatesList();
  const { materials } = useMaterials();
  const { settings } = useProjectSettings();
  const excelSync = useExcelSync();
  const toast = useAppToast();
  const { currentEstimateId } = useCurrentEstimate();
  const [openingId, setOpeningId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleOpen = async (id: string) => {
    const estimate = estimates.find((candidate) => candidate.id === id);
    if (!estimate) {
      return;
    }
    setOpeningId(id);
    try {
      await excelService.openEstimateInExcel(estimate);
    } catch (err) {
      toast.error(
        "Could Not Open Estimate",
        err instanceof Error ? err.message : "Try generating it first."
      );
    } finally {
      setOpeningId(undefined);
    }
  };

  const handleGenerateAll = async () => {
    const success = await excelSync.syncAll(materials, settings);
    if (success) {
      refresh();
      toast.success("All Estimates Generated");
    } else {
      toast.error("Failed to Generate Excel", "The workbook could not be synced. Try again.");
    }
  };

  const handleGenerateOne = async (id: string) => {
    const success = await excelSync.regenerateOne(id, materials, settings);
    if (success) {
      refresh();
      toast.success("Estimate Generated");
    } else {
      toast.error("Failed to Generate Estimate", "This estimate could not be synced. Try again.");
    }
  };

  const handleMoveUp = (id: string) => {
    const index = estimates.findIndex((estimate) => estimate.id === id);
    if (index >= 0) {
      moveEstimateUp(index);
    }
  };

  const handleMoveDown = (id: string) => {
    const index = estimates.findIndex((estimate) => estimate.id === id);
    if (index >= 0) {
      moveEstimateDown(index);
    }
  };

  return (
    <PageShell
      title="My Estimates"
      description="Every saved estimate, and the shared Excel workbook they generate into."
    >
      <div className={styles.page}>
        <div className={styles.actions}>
          <Button appearance="primary" disabled={excelSync.status === "syncing"} onClick={handleGenerateAll}>
            {excelSync.status === "syncing" ? "Generating..." : "Generate All Estimates"}
          </Button>
        </div>

        {estimates.length === 0 ? (
          <div className={styles.empty}>
            <DocumentTable24Regular />
            <Text weight="semibold">No Estimates Yet</Text>
            <Text>Build one in New Estimate, then come back here to generate it into Excel.</Text>
          </div>
        ) : (
          <div className={styles.list}>
            {estimates.map((estimate, index) => (
              <EstimateCard
                key={estimate.id}
                estimate={estimate}
                isBusy={busyId === estimate.id || openingId === estimate.id}
                isCurrent={currentEstimateId === estimate.id}
                onOpen={handleOpen}
                onRename={renameEstimate}
                onDelete={deleteEstimate}
                onGenerate={handleGenerateOne}
                isGenerating={excelSync.regeneratingId === estimate.id}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                canMoveUp={index > 0}
                canMoveDown={index < estimates.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};
