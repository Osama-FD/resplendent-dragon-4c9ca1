import * as React from "react";
import { Card, Field, Input, Text, Caption1, makeStyles, tokens } from "@fluentui/react-components";
import { Material } from "../../models/Material";
import { MaterialPrice } from "../../models/Project";
import { parseNumericInput } from "../../utils/number";

const useStyles = makeStyles({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalM,
  },
  fields: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
});

interface MaterialPriceRowProps {
  material: Material;
  price: MaterialPrice;
  onChange: (patch: Partial<Omit<MaterialPrice, "materialId">>) => void;
}

/** One material's pricing inputs on the Setup page - unit cost, plus MP cost when applicable. */
export const MaterialPriceRow: React.FC<MaterialPriceRowProps> = ({ material, price, onChange }) => {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <Text weight="semibold">{material.name}</Text>
      <Caption1>
        {material.category} · {material.unit}
      </Caption1>
      <div className={styles.fields}>
        <Field label="Unit Cost">
          <Input
            type="number"
            value={String(price.unitCost)}
            onChange={(_, data) => onChange({ unitCost: parseNumericInput(data.value) })}
          />
        </Field>
        {material.hasMpCost && (
          <Field label="MP Cost">
            <Input
              type="number"
              value={String(price.mpCost ?? 0)}
              onChange={(_, data) => onChange({ mpCost: parseNumericInput(data.value) })}
            />
          </Field>
        )}
      </div>
    </Card>
  );
};
