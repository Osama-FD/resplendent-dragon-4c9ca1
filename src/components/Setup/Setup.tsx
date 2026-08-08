import * as React from "react";
import { Field, Input, Text, Divider, makeStyles, tokens } from "@fluentui/react-components";
import { PageShell } from "../PageShell";
import { SectionHeading } from "../SectionHeading";
import { useProjectSettings } from "../../hooks/useProjectSettings";
import { useMaterials } from "../../hooks/useMaterials";
import { MaterialPriceRow } from "./MaterialPriceRow";
import { parseNumericInput } from "../../utils/number";
import { groupMaterialsByCategory } from "../../utils/materialGrouping";

const useStyles = makeStyles({
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  materialGroups: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
  },
  materialGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  materialsList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
});

/**
 * Project name, OH/Margin percentages, Second Fix MP, and a pricing row per
 * material sourced live from Material Manager. Every field autosaves
 * (debounced) via useProjectSettings - there is no explicit save button.
 */
export const Setup: React.FC = () => {
  const styles = useStyles();
  const { settings, updateSettings, getMaterialPrice, setMaterialPrice } = useProjectSettings();
  const { materials } = useMaterials();
  const materialGroups = React.useMemo(() => groupMaterialsByCategory(materials), [materials]);

  return (
    <PageShell
      title="Setup"
      description="Configure the project name, MP prices, Flexible Point cost, and OH & Margin percentages."
    >
      <div className={styles.section}>
        <Text weight="semibold">Project Settings</Text>
        <Field label="Project Name">
          <Input
            value={settings.projectName}
            onChange={(_, data) => updateSettings((current) => ({ ...current, projectName: data.value }))}
          />
        </Field>

        <div className={styles.grid}>
          <Field label="OH %">
            <Input
              type="number"
              value={String(settings.ohPercentage)}
              onChange={(_, data) =>
                updateSettings((current) => ({ ...current, ohPercentage: parseNumericInput(data.value) }))
              }
            />
          </Field>
          <Field label="Margin %">
            <Input
              type="number"
              value={String(settings.marginPercentage)}
              onChange={(_, data) =>
                updateSettings((current) => ({ ...current, marginPercentage: parseNumericInput(data.value) }))
              }
            />
          </Field>
        </div>

        <div className={styles.grid}>
          <Field label="Second Fix MP Price">
            <Input
              type="number"
              value={String(settings.secondFixMpPrice)}
              onChange={(_, data) =>
                updateSettings((current) => ({ ...current, secondFixMpPrice: parseNumericInput(data.value) }))
              }
            />
          </Field>
          <Field label="Flexible Point Unit Cost">
            <Input
              type="number"
              value={String(settings.flexiblePointUnitCost)}
              onChange={(_, data) =>
                updateSettings((current) => ({ ...current, flexiblePointUnitCost: parseNumericInput(data.value) }))
              }
            />
          </Field>
        </div>
      </div>

      <div className={styles.section}>
        <Text weight="semibold">Material Pricing</Text>
        {materials.length === 0 ? (
          <Text>Add materials in Material Manager to price them here.</Text>
        ) : (
          <div className={styles.materialGroups}>
            {materialGroups.map((group) =>
              group.materials.length === 0 ? null : (
                <div key={group.label} className={styles.materialGroup}>
                  <SectionHeading>{group.label}</SectionHeading>
                  <Divider />
                  <div className={styles.materialsList}>
                    {group.materials.map((material) => (
                      <MaterialPriceRow
                        key={material.id}
                        material={material}
                        price={getMaterialPrice(material.id)}
                        onChange={(patch) => setMaterialPrice(material.id, patch)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
};
