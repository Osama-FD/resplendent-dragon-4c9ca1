import * as React from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Field,
  Input,
  Switch,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Material, MaterialCategory, MaterialUnit } from "../../models/Material";
import { generateId } from "../../utils/id";
import { NativeSelect } from "../NativeSelect";

const CATEGORIES: MaterialCategory[] = ["Pipe", "Cable", "Accessory"];
const UNITS: MaterialUnit[] = ["m", "pcs"];
const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({ value, label: value }));
const UNIT_OPTIONS = UNITS.map((value) => ({ value, label: value }));

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
});

interface MaterialFormDialogProps {
  open: boolean;
  material?: Material;
  isNameTaken: (name: string, excludeId?: string) => boolean;
  onSave: (material: Material) => void;
  onClose: () => void;
  isSaving?: boolean;
}

/** Create/edit form for a single material. Reused for both flows via the optional `material` prop. */
export const MaterialFormDialog: React.FC<MaterialFormDialogProps> = ({
  open,
  material,
  isNameTaken,
  onSave,
  onClose,
  isSaving = false,
}) => {
  const styles = useStyles();
  const isEditing = material !== undefined;

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<MaterialCategory>("Pipe");
  const [unit, setUnit] = React.useState<MaterialUnit>("m");
  const [hasMpCost, setHasMpCost] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setName(material?.name ?? "");
      setCategory(material?.category ?? "Pipe");
      setUnit(material?.unit ?? "m");
      setHasMpCost(material?.hasMpCost ?? false);
      setNameError(undefined);
    }
  }, [open, material]);

  const handleCategoryChange = (next: MaterialCategory) => {
    setCategory(next);
    if (next !== "Pipe") {
      setHasMpCost(false);
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required.");
      return;
    }
    if (isNameTaken(trimmedName, material?.id)) {
      setNameError("A material with this name already exists.");
      return;
    }

    onSave({
      id: material?.id ?? generateId(),
      name: trimmedName,
      category,
      unit,
      hasMpCost: category === "Pipe" ? hasMpCost : false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEditing ? "Edit Material" : "Add Material"}</DialogTitle>
          <DialogContent className={styles.form}>
            <Field label="Name" required validationState={nameError ? "error" : "none"} validationMessage={nameError}>
              <Input
                value={name}
                onChange={(_, data) => {
                  setName(data.value);
                  setNameError(undefined);
                }}
              />
            </Field>

            <Field label="Category" required>
              <NativeSelect value={category} options={CATEGORY_OPTIONS} onChange={handleCategoryChange} />
            </Field>

            <Field label="Unit" required>
              <NativeSelect value={unit} options={UNIT_OPTIONS} onChange={setUnit} />
            </Field>

            <Field label="Has First Fix MP cost">
              <Switch
                checked={hasMpCost}
                disabled={category !== "Pipe"}
                onChange={(_, data) => setHasMpCost(data.checked)}
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" disabled={isSaving} onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" disabled={isSaving} onClick={handleSave}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
