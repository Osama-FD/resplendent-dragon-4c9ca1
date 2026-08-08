import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Input,
  Button,
  Text,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Add20Regular, Delete16Regular, DocumentBulletList24Regular } from "@fluentui/react-icons";
import { Material } from "../../models/Material";
import { NativeSelect } from "../NativeSelect";
import { parseNumericInput } from "../../utils/number";

const useStyles = makeStyles({
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
    padding: tokens.spacingVerticalL,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
  },
  numberInput: {
    width: "80px",
  },
  rowInvalid: {
    backgroundColor: tokens.colorPaletteRedBackground1,
  },
});

/** The common row shape every section (Pipes/Cables/Accessories) needs. Accessories omit length. */
export interface MaterialLineRow {
  id: string;
  materialId: string;
  quantity: number;
  length?: number;
}

interface MaterialLineTableProps<T extends MaterialLineRow> {
  /** Materials already filtered to the relevant category (Pipe/Cable/Accessory). */
  materials: Material[];
  materialColumnLabel: string;
  rows: T[];
  showLength: boolean;
  addButtonLabel: string;
  /** e.g. "No Pipes Added" - falls back to a generic message if omitted. */
  emptyMessage?: string;
  /** Row ids with a validation error - highlighted so the offending row is easy to spot. */
  invalidRowIds?: ReadonlySet<string>;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<Omit<T, "id">>) => void;
  onRemove: (id: string) => void;
}

/**
 * Reusable editable table for First Fix Pipes, Second Fix Cables, and
 * Accessories - the only difference between them is whether a Length
 * column is shown and which material category feeds the picker. Material
 * options are always sourced live from Material Manager - nothing here is
 * hardcoded. Each row carries a `data-row-id` so validation can scroll a
 * specific row into view.
 */
export function MaterialLineTable<T extends MaterialLineRow>({
  materials,
  materialColumnLabel,
  rows,
  showLength,
  addButtonLabel,
  emptyMessage,
  invalidRowIds,
  onAdd,
  onUpdate,
  onRemove,
}: MaterialLineTableProps<T>) {
  const styles = useStyles();
  const materialOptions = materials.map((material) => ({ value: material.id, label: material.name }));
  const hasMaterials = materials.length > 0;

  return (
    <div className={styles.section}>
      {rows.length === 0 ? (
        <div className={styles.empty}>
          <DocumentBulletList24Regular />
          <Text>{emptyMessage ?? `No ${materialColumnLabel} Rows Added`}</Text>
        </div>
      ) : (
        <Table aria-label={materialColumnLabel}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{materialColumnLabel}</TableHeaderCell>
              {showLength && <TableHeaderCell>Length</TableHeaderCell>}
              <TableHeaderCell>Qty</TableHeaderCell>
              <TableHeaderCell> </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isInvalid = invalidRowIds?.has(row.id) ?? false;
              return (
                <TableRow key={row.id} data-row-id={row.id} className={isInvalid ? styles.rowInvalid : undefined}>
                  <TableCell>
                    <NativeSelect
                      value={row.materialId}
                      placeholder={hasMaterials ? `Select ${materialColumnLabel.toLowerCase()}` : "No materials"}
                      options={materialOptions}
                      disabled={!hasMaterials}
                      ariaLabel={materialColumnLabel}
                      onChange={(materialId) => onUpdate(row.id, { materialId } as Partial<Omit<T, "id">>)}
                    />
                  </TableCell>
                  {showLength && (
                    <TableCell>
                      <Input
                        className={styles.numberInput}
                        type="number"
                        value={String(row.length ?? 0)}
                        onChange={(_, data) =>
                          onUpdate(row.id, { length: parseNumericInput(data.value) } as Partial<Omit<T, "id">>)
                        }
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Input
                      className={styles.numberInput}
                      type="number"
                      value={String(row.quantity)}
                      onChange={(_, data) =>
                        onUpdate(row.id, { quantity: parseNumericInput(data.value) } as Partial<Omit<T, "id">>)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Delete16Regular />}
                      aria-label={`Remove ${materialColumnLabel.toLowerCase()} row`}
                      onClick={() => onRemove(row.id)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Button appearance="secondary" icon={<Add20Regular />} onClick={onAdd} disabled={!hasMaterials}>
        {addButtonLabel}
      </Button>
      {!hasMaterials && (
        <Text size={200} className={styles.hint}>
          No {materialColumnLabel.toLowerCase()} materials yet - add one in Material Manager.
        </Text>
      )}
    </div>
  );
}
