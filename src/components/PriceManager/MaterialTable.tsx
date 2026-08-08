import * as React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Button,
  Badge,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Edit16Regular, Delete16Regular, Box24Regular } from "@fluentui/react-icons";
import { Material } from "../../models/Material";

const useStyles = makeStyles({
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalXL,
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    justifyContent: "flex-end",
  },
});

interface MaterialTableProps {
  materials: Material[];
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
}

/** Presentational list of materials. Owns no state - all actions bubble up to the caller. */
export const MaterialTable: React.FC<MaterialTableProps> = ({ materials, onEdit, onDelete }) => {
  const styles = useStyles();

  if (materials.length === 0) {
    return (
      <div className={styles.empty}>
        <Box24Regular />
        <Text weight="semibold">No Materials Yet</Text>
        <Text>Add your first material to get started.</Text>
      </div>
    );
  }

  return (
    <Table aria-label="Materials">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell>Category</TableHeaderCell>
          <TableHeaderCell>Unit</TableHeaderCell>
          <TableHeaderCell>MP Cost</TableHeaderCell>
          <TableHeaderCell> </TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {materials.map((material) => (
          <TableRow key={material.id}>
            <TableCell>
              <TableCellLayout>{material.name}</TableCellLayout>
            </TableCell>
            <TableCell>{material.category}</TableCell>
            <TableCell>{material.unit}</TableCell>
            <TableCell>
              {material.hasMpCost ? <Badge appearance="tint" color="brand">Enabled</Badge> : "-"}
            </TableCell>
            <TableCell>
              <div className={styles.actions}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Edit16Regular />}
                  aria-label={`Edit ${material.name}`}
                  onClick={() => onEdit(material)}
                />
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Delete16Regular />}
                  aria-label={`Delete ${material.name}`}
                  onClick={() => onDelete(material)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
