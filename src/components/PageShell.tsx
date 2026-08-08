import * as React from "react";
import { makeStyles, tokens, Title2, Body1 } from "@fluentui/react-components";

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    boxSizing: "border-box",
    height: "100%",
  },
  description: {
    color: tokens.colorNeutralForeground3,
  },
});

interface PageShellProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

/** Shared page frame (title + description) reused by every sidebar destination. */
export const PageShell: React.FC<PageShellProps> = ({ title, description, children }) => {
  const styles = useStyles();

  return (
    <div className={styles.page}>
      <Title2>{title}</Title2>
      <Body1 className={styles.description}>{description}</Body1>
      {children}
    </div>
  );
};
