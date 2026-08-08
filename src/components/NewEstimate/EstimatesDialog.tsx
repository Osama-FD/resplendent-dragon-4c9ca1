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
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { DocumentTable24Regular } from "@fluentui/react-icons";
import { useEstimatesList } from "../../hooks/useEstimatesList";
import { useCurrentEstimate } from "../../app/CurrentEstimateContext";
import { EstimateCard } from "./EstimateCard";

const useStyles = makeStyles({
  surface: {
    // Task pane is narrow and can be short too - cap width for wider hosts,
    // but always leave headroom so the fixed header/footer never get pushed
    // off-screen by a long estimate list.
    width: "100%",
    maxWidth: "480px",
  },
  body: {
    // DialogBody is the flex column that fixes DialogTitle/DialogActions in
    // place and lets DialogContent be the only part that scrolls.
    display: "flex",
    flexDirection: "column",
    maxHeight: "min(600px, 85vh)",
    minHeight: 0,
  },
  content: {
    // minHeight: 0 is required on a flex child for its own overflow:auto to
    // work at all - without it the child refuses to shrink below its
    // content size and the whole dialog grows/clips instead of scrolling.
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: tokens.spacingHorizontalXS,
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
});

interface EstimatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEstimate: (id: string) => void;
}

/**
 * Lists every saved estimate for this project, with Open/Rename/Delete
 * actions per card. Fixed header + footer, scrollable middle - the card
 * list can grow to any length without the dialog itself growing or
 * clipping its buttons.
 */
export const EstimatesDialog: React.FC<EstimatesDialogProps> = ({ open, onOpenChange, onOpenEstimate }) => {
  const styles = useStyles();
  const { estimates, refresh, renameEstimate, deleteEstimate, busyId } = useEstimatesList();
  const { currentEstimateId } = useCurrentEstimate();

  React.useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.body}>
          <DialogTitle>My Estimates</DialogTitle>
          <DialogContent className={styles.content}>
            {estimates.length === 0 ? (
              <div className={styles.empty}>
                <DocumentTable24Regular />
                <Text>No Estimates Yet</Text>
              </div>
            ) : (
              <div className={styles.list}>
                {estimates.map((estimate) => (
                  <EstimateCard
                    key={estimate.id}
                    estimate={estimate}
                    isBusy={busyId === estimate.id}
                    isCurrent={currentEstimateId === estimate.id}
                    onOpen={(id) => {
                      onOpenEstimate(id);
                      onOpenChange(false);
                    }}
                    onRename={renameEstimate}
                    onDelete={deleteEstimate}
                  />
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
