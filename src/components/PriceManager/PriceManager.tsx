import * as React from "react";
import {
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Add20Regular } from "@fluentui/react-icons";
import { PageShell } from "../PageShell";
import { SectionHeading } from "../SectionHeading";
import { MaterialTable } from "./MaterialTable";
import { MaterialFormDialog } from "./MaterialFormDialog";
import { useMaterials } from "../../hooks/useMaterials";
import { Material } from "../../models/Material";
import { groupMaterialsByCategory } from "../../utils/materialGrouping";

const useStyles = makeStyles({
  toolbar: {
    display: "flex",
    justifyContent: "flex-end",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
});

/** Material Manager: full CRUD over the material list that New Estimate will draw from. */
export const PriceManager: React.FC = () => {
  const styles = useStyles();
  const { materials, isSaving, addMaterial, updateMaterial, deleteMaterial, isNameTaken } = useMaterials();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingMaterial, setEditingMaterial] = React.useState<Material | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = React.useState<Material | undefined>(undefined);
  const groups = React.useMemo(() => groupMaterialsByCategory(materials), [materials]);

  const openCreateForm = () => {
    setEditingMaterial(undefined);
    setFormOpen(true);
  };

  const openEditForm = (material: Material) => {
    setEditingMaterial(material);
    setFormOpen(true);
  };

  const handleSave = async (material: Material) => {
    const ok = editingMaterial ? await updateMaterial(material) : await addMaterial(material);
    if (ok) {
      setFormOpen(false);
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete) {
      const ok = await deleteMaterial(pendingDelete.id);
      if (ok) {
        setPendingDelete(undefined);
      }
    }
  };

  return (
    <PageShell
      title="Material Manager"
      description="Create, edit, and delete materials. Changes appear automatically in New Estimate."
    >
      <div className={styles.body}>
        <div className={styles.toolbar}>
          <Button appearance="primary" icon={<Add20Regular />} onClick={openCreateForm}>
            Add Material
          </Button>
        </div>

        {materials.length === 0 ? (
          <MaterialTable materials={[]} onEdit={openEditForm} onDelete={setPendingDelete} />
        ) : (
          groups.map((group) =>
            group.materials.length === 0 ? null : (
              <div key={group.label} className={styles.group}>
                <SectionHeading>{group.label}</SectionHeading>
                <Divider />
                <MaterialTable materials={group.materials} onEdit={openEditForm} onDelete={setPendingDelete} />
              </div>
            )
          )
        )}
      </div>

      <MaterialFormDialog
        open={formOpen}
        material={editingMaterial}
        isNameTaken={isNameTaken}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />

      <Dialog
        open={pendingDelete !== undefined}
        onOpenChange={(_, data) => !data.open && setPendingDelete(undefined)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete material?</DialogTitle>
            <DialogContent>
              {pendingDelete && `Are you sure you want to delete "${pendingDelete.name}"? This cannot be undone.`}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" disabled={isSaving} onClick={() => setPendingDelete(undefined)}>
                Cancel
              </Button>
              <Button appearance="primary" disabled={isSaving} onClick={confirmDelete}>
                {isSaving ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </PageShell>
  );
};
