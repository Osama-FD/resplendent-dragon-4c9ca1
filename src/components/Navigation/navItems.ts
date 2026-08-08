import {
  Home24Regular,
  DocumentAdd24Regular,
  DocumentTable24Regular,
  Options24Regular,
  Box24Regular,
  FolderOpen24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";
import { NavItem } from "../../types/navigation";

/** Single source of truth for the sidebar. Add a page here and it appears in navigation. */
export const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home24Regular },
  { id: "newEstimate", label: "New Estimate", icon: DocumentAdd24Regular },
  { id: "myEstimates", label: "My Estimates", icon: DocumentTable24Regular },
  { id: "setup", label: "Setup", icon: Options24Regular },
  { id: "materialManager", label: "Material Manager", icon: Box24Regular },
  { id: "projects", label: "Projects", icon: FolderOpen24Regular },
  { id: "settings", label: "Settings", icon: Settings24Regular },
];
