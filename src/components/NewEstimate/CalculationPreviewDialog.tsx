import * as React from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { CalculationResult } from "../../models/Calculation";
import { Material } from "../../models/Material";
import { buildCalculationReport } from "../../utils/calculationReport";
import { SectionHeading } from "../SectionHeading";
import { ExcelSyncStatus } from "../../hooks/useExcelSync";

const useStyles = makeStyles({
  surface: {
    width: "100%",
    maxWidth: "640px",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "min(720px, 85vh)",
    minHeight: 0,
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
    paddingRight: tokens.spacingHorizontalXS,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  tableWrap: {
    // Every row-level table has enough columns that a narrow task pane
    // needs to scroll horizontally rather than squeeze cells unreadably.
    overflowX: "auto",
  },
  table: {
    minWidth: "600px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
  },
  summaryLabel: {
    color: tokens.colorNeutralForeground3,
  },
  grandTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase400,
  },
  empty: {
    color: tokens.colorNeutralForeground3,
  },
  copyStatus: {
    color: tokens.colorPaletteGreenForeground1,
  },
  generateStatus: {
    color: tokens.colorPaletteGreenForeground1,
  },
  generateError: {
    color: tokens.colorPaletteRedForeground1,
  },
});

function currency(value: number): string {
  return value.toFixed(2);
}

function materialName(materials: Material[], materialId: string): string {
  return materials.find((material) => material.id === materialId)?.name ?? "(unknown material)";
}

interface CalculationPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  result: CalculationResult | undefined;
  materials: Material[];
  ohPercentage: number;
  marginPercentage: number;
  /** Saves this estimate (if needed) and syncs it into the shared Excel workbook. Owned by the caller - this dialog only triggers it. */
  onGenerateExcel: () => void;
  generateStatus: ExcelSyncStatus;
}

/**
 * Calculation Preview - every intermediate value calculator.ts produced,
 * down to individual rows, so a user can verify each figure against the
 * original Excel sheet. Nothing here is calculated in the UI: every number
 * is read directly off CalculationResult. "Generate Excel" delegates to the
 * caller (which owns the estimate-saving + Excel-sync workflow) - this
 * dialog only displays and triggers it.
 */
export const CalculationPreviewDialog: React.FC<CalculationPreviewDialogProps> = ({
  open,
  onOpenChange,
  title,
  result,
  materials,
  ohPercentage,
  marginPercentage,
  onGenerateExcel,
  generateStatus,
}) => {
  const styles = useStyles();
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = async () => {
    if (!result) {
      return;
    }
    const report = buildCalculationReport(title, result, materials, ohPercentage, marginPercentage);
    try {
      await navigator.clipboard.writeText(report);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    setTimeout(() => setCopyStatus("idle"), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.body}>
          <DialogTitle>Calculation Preview</DialogTitle>
          <DialogContent className={styles.content}>
            {!result ? (
              <Text className={styles.empty}>Nothing calculated yet.</Text>
            ) : (
              <>
                <Text weight="semibold">{title}</Text>

                <div className={styles.section}>
                  <SectionHeading>First Fix</SectionHeading>
                  <Divider />
                  {result.pipes.length > 0 && (
                    <div className={styles.tableWrap}>
                      <Table size="small" className={styles.table} aria-label="First Fix Pipes">
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Material</TableHeaderCell>
                            <TableHeaderCell>Length</TableHeaderCell>
                            <TableHeaderCell>Quantity</TableHeaderCell>
                            <TableHeaderCell>Unit Cost</TableHeaderCell>
                            <TableHeaderCell>Pipe MP Cost</TableHeaderCell>
                            <TableHeaderCell>Material Cost</TableHeaderCell>
                            <TableHeaderCell>Pipe MP Cost Total</TableHeaderCell>
                            <TableHeaderCell>Row Total</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.pipes.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>{materialName(materials, line.materialId)}</TableCell>
                              <TableCell>{line.length}</TableCell>
                              <TableCell>{line.quantity}</TableCell>
                              <TableCell>{currency(line.unitCost)}</TableCell>
                              <TableCell>{currency(line.mpCost)}</TableCell>
                              <TableCell>{currency(line.cost)}</TableCell>
                              <TableCell>{currency(line.mp)}</TableCell>
                              <TableCell>{currency(line.rowTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {result.accessories.length > 0 && (
                    <div className={styles.tableWrap}>
                      <Table size="small" aria-label="Accessories">
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Material</TableHeaderCell>
                            <TableHeaderCell>Quantity</TableHeaderCell>
                            <TableHeaderCell>Unit Cost</TableHeaderCell>
                            <TableHeaderCell>Total</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.accessories.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>{materialName(materials, line.materialId)}</TableCell>
                              <TableCell>{line.quantity}</TableCell>
                              <TableCell>{currency(line.unitCost)}</TableCell>
                              <TableCell>{currency(line.cost)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Pipe Cost Total</Text>
                    <Text>{currency(result.pipeCosts)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Pipe MP Total</Text>
                    <Text>{currency(result.pipeMp)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Accessories Total</Text>
                    <Text>{currency(result.accessoryCosts)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>First Fix Total</Text>
                    <Text weight="semibold">{currency(result.firstFixTotal)}</Text>
                  </div>
                </div>

                <div className={styles.section}>
                  <SectionHeading>Second Fix</SectionHeading>
                  <Divider />
                  {result.cables.length > 0 && (
                    <div className={styles.tableWrap}>
                      <Table size="small" className={styles.table} aria-label="Second Fix Cables">
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Material</TableHeaderCell>
                            <TableHeaderCell>Length</TableHeaderCell>
                            <TableHeaderCell>Quantity</TableHeaderCell>
                            <TableHeaderCell>Unit Cost</TableHeaderCell>
                            <TableHeaderCell>Second Fix MP</TableHeaderCell>
                            <TableHeaderCell>Cable Cost</TableHeaderCell>
                            <TableHeaderCell>Second Fix MP Cost</TableHeaderCell>
                            <TableHeaderCell>Row Total</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.cables.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell>{materialName(materials, line.materialId)}</TableCell>
                              <TableCell>{line.length}</TableCell>
                              <TableCell>{line.quantity}</TableCell>
                              <TableCell>{currency(line.unitCost)}</TableCell>
                              <TableCell>{currency(line.secondFixMpRate)}</TableCell>
                              <TableCell>{currency(line.cost)}</TableCell>
                              <TableCell>{currency(line.mp)}</TableCell>
                              <TableCell>{currency(line.rowTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className={styles.tableWrap}>
                    <Table size="small" aria-label="Flexible Point">
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>Material</TableHeaderCell>
                          <TableHeaderCell>Quantity</TableHeaderCell>
                          <TableHeaderCell>Unit Cost</TableHeaderCell>
                          <TableHeaderCell>Total</TableHeaderCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Flexible Point</TableCell>
                          <TableCell>{result.flexiblePoints.quantity}</TableCell>
                          <TableCell>{currency(result.flexiblePoints.unitCost)}</TableCell>
                          <TableCell>{currency(result.flexiblePoints.cost)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Cable Total</Text>
                    <Text>{currency(result.cableCosts)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Flexible Point Total</Text>
                    <Text>{currency(result.flexiblePointCost)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Second Fix MP Total</Text>
                    <Text>{currency(result.secondFixMp)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Second Fix Total</Text>
                    <Text weight="semibold">{currency(result.secondFixTotal)}</Text>
                  </div>
                </div>

                <div className={styles.section}>
                  <SectionHeading>Summary</SectionHeading>
                  <Divider />
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Total Price</Text>
                    <Text>{currency(result.totalPrice)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>OH %</Text>
                    <Text>{ohPercentage}%</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>OH Amount</Text>
                    <Text>{currency(result.ohAmount)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Total With OH</Text>
                    <Text>{currency(result.totalWithOh)}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Margin %</Text>
                    <Text>{marginPercentage}%</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text className={styles.summaryLabel}>Margin Amount</Text>
                    <Text>{currency(result.marginAmount)}</Text>
                  </div>
                  <div className={styles.grandTotalRow}>
                    <Text weight="bold">Grand Total</Text>
                    <Text weight="bold">{currency(result.grandTotal)}</Text>
                  </div>
                </div>

                {copyStatus === "copied" && <Text className={styles.copyStatus}>Copied to clipboard.</Text>}
                {copyStatus === "failed" && <Text>Could not copy - try selecting the text manually.</Text>}
                {generateStatus === "done" && (
                  <Text className={styles.generateStatus}>Workbook synced - check the Estimates sheet.</Text>
                )}
                {generateStatus === "failed" && (
                  <Text className={styles.generateError}>Could not sync the workbook. Try again.</Text>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions className={styles.actions}>
            <Button
              appearance="primary"
              disabled={!result || generateStatus === "syncing"}
              onClick={onGenerateExcel}
            >
              {generateStatus === "syncing" ? "Generating..." : "Generate Excel"}
            </Button>
            <Button appearance="secondary" disabled={!result} onClick={handleCopy}>
              Copy Calculation Report
            </Button>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
