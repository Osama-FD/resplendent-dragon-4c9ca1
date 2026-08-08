import * as React from "react";
import { Card, Text, Caption1, Badge, Button, Input, Spinner, makeStyles, tokens } from "@fluentui/react-components";
import {
  Edit16Regular,
  Delete16Regular,
  Checkmark16Regular,
  Dismiss16Regular,
  ArrowUp16Regular,
  ArrowDown16Regular,
} from "@fluentui/react-icons";
import { Estimate } from "../../models/Estimate";

const useStyles = makeStyles({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingHorizontalM,
    width: "100%",
    boxSizing: "border-box",
  },
  cardCurrent: {
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  meta: {
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: "flex",
    // Buttons wrap onto a second line in a narrow task pane rather than
    // being squeezed/clipped by the flex row - never allowed to overflow.
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
    alignItems: "center",
  },
  renameRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
    alignItems: "center",
  },
  renameInput: {
    // Allows the input to actually shrink in a flex row instead of forcing
    // an overflow - flex items default to a min-width based on content.
    flex: "1 1 120px",
    minWidth: 0,
  },
  confirmDelete: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  confirmDeleteActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
});

interface EstimateCardProps {
  estimate: Estimate;
  onOpen: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  /** True while a rename/delete for this specific card is in flight - disables its buttons. */
  isBusy?: boolean;
  /** True if this is the estimate currently open in the New Estimate builder. */
  isCurrent?: boolean;
  /** Regenerates only this estimate's section in Excel. Only supplied by My Estimates - omit to hide the button. */
  onGenerate?: (id: string) => void;
  /** True while this specific card's Generate is in flight. */
  isGenerating?: boolean;
  /** Reordering - only supplied by My Estimates, where order matters (it's what Generate All follows). Omit both to hide the controls entirely. */
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

/**
 * One saved estimate's summary (name + grand total) with Open/Rename/Delete
 * actions. Shared between the "My Estimates" dialog (opens the estimate for
 * editing) and the standalone My Estimates page (opens it in Excel) - what
 * "Open" does is entirely up to the caller's onOpen handler. Memoized since
 * a project can have 100+ estimates - without it, editing one card's rename
 * text would re-render every other card in the list too.
 */
export const EstimateCard: React.FC<EstimateCardProps> = React.memo(function EstimateCard({
  estimate,
  onOpen,
  onRename,
  onDelete,
  isBusy = false,
  isCurrent = false,
  onGenerate,
  isGenerating = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) {
  const styles = useStyles();
  const [renaming, setRenaming] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState(estimate.title);

  const startRename = () => {
    setDraftTitle(estimate.title);
    setRenaming(true);
  };

  const confirmRename = () => {
    if (draftTitle.trim()) {
      onRename(estimate.id, draftTitle.trim());
    }
    setRenaming(false);
  };

  return (
    <Card className={isCurrent ? `${styles.card} ${styles.cardCurrent}` : styles.card}>
      {renaming ? (
        <div className={styles.renameRow}>
          <Input
            className={styles.renameInput}
            value={draftTitle}
            onChange={(_, data) => setDraftTitle(data.value)}
            disabled={isBusy}
            autoFocus
          />
          <Button
            appearance="subtle"
            icon={<Checkmark16Regular />}
            aria-label="Confirm rename"
            disabled={isBusy}
            onClick={confirmRename}
          />
          <Button
            appearance="subtle"
            icon={<Dismiss16Regular />}
            aria-label="Cancel rename"
            disabled={isBusy}
            onClick={() => setRenaming(false)}
          />
        </div>
      ) : (
        <div className={styles.titleRow}>
          <Text weight="semibold">{estimate.title}</Text>
          {isCurrent && (
            <Badge appearance="tint" color="brand" size="small">
              Current
            </Badge>
          )}
        </div>
      )}

      <Caption1 className={styles.meta}>
        Grand Total: {estimate.grandTotal > 0 ? estimate.grandTotal.toFixed(2) : "Pending"}
      </Caption1>

      {confirmingDelete ? (
        <div className={styles.confirmDelete}>
          <Text>Are you sure? This action cannot be undone.</Text>
          <div className={styles.confirmDeleteActions}>
            <Button appearance="primary" size="small" disabled={isBusy} onClick={() => onDelete(estimate.id)}>
              {isBusy ? <Spinner size="tiny" /> : "Confirm Delete"}
            </Button>
            <Button appearance="secondary" size="small" disabled={isBusy} onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Button appearance="primary" size="small" disabled={isBusy} onClick={() => onOpen(estimate.id)}>
            Open
          </Button>
          {onGenerate && (
            <Button
              appearance="secondary"
              size="small"
              disabled={isBusy || isGenerating}
              onClick={() => onGenerate(estimate.id)}
            >
              {isGenerating ? <Spinner size="tiny" /> : "Generate"}
            </Button>
          )}
          <Button
            appearance="secondary"
            size="small"
            icon={<Edit16Regular />}
            disabled={isBusy}
            onClick={startRename}
          >
            Rename
          </Button>
          <Button
            appearance="secondary"
            size="small"
            icon={<Delete16Regular />}
            disabled={isBusy}
            onClick={() => setConfirmingDelete(true)}
          >
            Delete
          </Button>
          {(onMoveUp || onMoveDown) && (
            <>
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowUp16Regular />}
                aria-label="Move up"
                disabled={isBusy || !canMoveUp}
                onClick={() => onMoveUp?.(estimate.id)}
              />
              <Button
                appearance="subtle"
                size="small"
                icon={<ArrowDown16Regular />}
                aria-label="Move down"
                disabled={isBusy || !canMoveDown}
                onClick={() => onMoveDown?.(estimate.id)}
              />
            </>
          )}
          {isBusy && <Spinner size="tiny" />}
        </div>
      )}
    </Card>
  );
});
