import * as React from "react";
import { Button, makeStyles, tokens, Text } from "@fluentui/react-components";
import { Navigation24Regular } from "@fluentui/react-icons";
import { NAV_ITEMS } from "./navItems";
import { PageId } from "../../types/navigation";

const useStyles = makeStyles({
  bar: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
  },
});

interface TopBarProps {
  activePage: PageId;
  onMenuClick: () => void;
}

/** Fixed header housing the hamburger toggle for the sidebar and the current page title. */
export const TopBar: React.FC<TopBarProps> = ({ activePage, onMenuClick }) => {
  const styles = useStyles();
  const current = NAV_ITEMS.find((item) => item.id === activePage);

  return (
    <header className={styles.bar}>
      <Button
        appearance="subtle"
        aria-label="Open navigation"
        icon={<Navigation24Regular />}
        onClick={onMenuClick}
      />
      <Text size={400} className={styles.title}>
        {current?.label ?? "Electrical Estimator"}
      </Text>
    </header>
  );
};
