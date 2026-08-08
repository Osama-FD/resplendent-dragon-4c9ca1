import type { ComponentType } from "react";

/** Identifiers for every sidebar destination. Add new pages here first. */
export type PageId = "home" | "newEstimate" | "myEstimates" | "setup" | "materialManager" | "projects" | "settings";

export interface NavItem {
  id: PageId;
  label: string;
  icon: ComponentType;
}
