import * as React from "react";
import {
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Text,
  Title2,
  Body1,
  Caption1,
  Caption2,
  Card,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowDownload20Regular, ArrowUpload20Regular, DeleteDismiss20Regular } from "@fluentui/react-icons";
import { PageShell } from "../PageShell";
import { SectionHeading } from "../SectionHeading";
import { useAppToast } from "../../hooks/useAppToast";
import { storageService } from "../../services/storage";

const APP_NAME = "Electrical Estimator";
const APP_TAGLINE = "Professional Excel Estimation Tool";
const APP_VERSION_LABEL = "Version 1.0.0";
const APP_BUILD_LABEL = "Build 2026.08";
const APP_COPYRIGHT_YEAR = "2026";
const APP_AUTHOR = "Osama Dweedar";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  aboutCard: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    maxWidth: "480px",
    boxSizing: "border-box",
  },
  aboutIntro: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  aboutTagline: {
    color: tokens.colorNeutralForeground3,
  },
  aboutMeta: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  aboutMetaLabel: {
    color: tokens.colorNeutralForeground3,
  },
  aboutCopyright: {
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
});

interface BackupFile {
  materials?: unknown;
  projectSettings?: unknown;
  estimates?: unknown;
  exportedAt?: string;
}

/** App info, and local backup/reset - the only place in the app that can wipe or replace all stored data. */
export const Settings: React.FC = () => {
  const styles = useStyles();
  const toast = useAppToast();
  const [resetOpen, setResetOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const backup: Required<BackupFile> = {
      materials: storageService.getMaterials(),
      projectSettings: storageService.getProjectSettings() ?? null,
      estimates: storageService.getAllEstimates(),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `electrical-estimator-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Backup Exported");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupFile;

      if (!Array.isArray(parsed.materials) || !Array.isArray(parsed.estimates)) {
        throw new Error("This file doesn't look like an Electrical Estimator backup.");
      }

      await storageService.saveMaterials(parsed.materials as Parameters<typeof storageService.saveMaterials>[0]);
      if (parsed.projectSettings) {
        await storageService.saveProjectSettings(
          parsed.projectSettings as Parameters<typeof storageService.saveProjectSettings>[0]
        );
      }
      await storageService.replaceAllEstimates(parsed.estimates as Parameters<typeof storageService.replaceAllEstimates>[0]);

      toast.success("Backup Imported", "Reloading to apply the imported data...");
      window.setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error("Import Failed", err instanceof Error ? err.message : "Could not read this backup file.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await storageService.resetAll();
      toast.success("All Data Reset", "Reloading...");
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      toast.error("Failed to Reset", "Your data could not be reset. Try again.");
      setIsResetting(false);
    }
  };

  return (
    <PageShell title="Settings" description="Application info, backups, and reset.">
      <div className={styles.page}>
        <div className={styles.section}>
          <SectionHeading>About</SectionHeading>
          <Divider />
          <Card className={styles.aboutCard}>
            <div className={styles.aboutIntro}>
              <Title2>{APP_NAME}</Title2>
              <Body1 className={styles.aboutTagline}>{APP_TAGLINE}</Body1>
            </div>
            <div className={styles.aboutMeta}>
              <Caption1 className={styles.aboutMetaLabel}>{APP_VERSION_LABEL}</Caption1>
              <Caption1 className={styles.aboutMetaLabel}>{APP_BUILD_LABEL}</Caption1>
            </div>
            <Caption2 className={styles.aboutCopyright}>
              © {APP_COPYRIGHT_YEAR} {APP_AUTHOR}
              <br />
              All Rights Reserved.
            </Caption2>
          </Card>
        </div>

        <div className={styles.section}>
          <SectionHeading>Backup</SectionHeading>
          <Divider />
          <Text>
            Export everything (materials, project settings, and estimates) as a JSON file, or restore
            from one.
          </Text>
          <div className={styles.actions}>
            <Button appearance="secondary" icon={<ArrowDownload20Regular />} onClick={handleExport}>
              Export Local Backup
            </Button>
            <Button
              appearance="secondary"
              icon={<ArrowUpload20Regular />}
              disabled={isImporting}
              onClick={handleImportClick}
            >
              {isImporting ? "Importing..." : "Import Backup"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
          </div>
        </div>

        <div className={styles.section}>
          <SectionHeading>Danger Zone</SectionHeading>
          <Divider />
          <Text>Permanently deletes every material, project setting, and estimate from this workbook.</Text>
          <div className={styles.actions}>
            <Button appearance="secondary" icon={<DeleteDismiss20Regular />} onClick={() => setResetOpen(true)}>
              Reset All Data
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={(_, data) => !data.open && setResetOpen(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Reset all data?</DialogTitle>
            <DialogContent>
              Are you sure? This deletes every material, project setting, and estimate in this
              workbook. This action cannot be undone.
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" disabled={isResetting} onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" disabled={isResetting} onClick={handleReset}>
                {isResetting ? "Resetting..." : "Reset Everything"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </PageShell>
  );
};
