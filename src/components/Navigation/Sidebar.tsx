import * as React from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { PageId } from "../../types/navigation";
import { NAV_ITEMS } from "./navItems";

const useStyles = makeStyles({
  drawer: {
    width: "260px",
    maxWidth: "80vw",
  },
  navList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  navButton: {
    justifyContent: "flex-start",
    width: "100%",
  },
  navButtonActive: {
    justifyContent: "flex-start",
    width: "100%",
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
  },
});

interface SidebarProps {
  open: boolean;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenChange: (open: boolean) => void;
}

/** Slide-out sidebar navigation. Kept as a drawer so it stays usable in a narrow task pane. */
export const Sidebar: React.FC<SidebarProps> = ({ open, activePage, onNavigate, onOpenChange }) => {
  const styles = useStyles();

  return (
    <Drawer
      className={styles.drawer}
      open={open}
      onOpenChange={(_, data) => onOpenChange(data.open)}
      position="start"
      type="overlay"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close navigation"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          Electrical Estimator
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <nav className={styles.navList} aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activePage;
            return (
              <Button
                key={item.id}
                appearance={isActive ? "subtle" : "transparent"}
                className={isActive ? styles.navButtonActive : styles.navButton}
                icon={<Icon />}
                onClick={() => {
                  onNavigate(item.id);
                  onOpenChange(false);
                }}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Button>
            );
          })}
        </nav>
      </DrawerBody>
    </Drawer>
  );
};
