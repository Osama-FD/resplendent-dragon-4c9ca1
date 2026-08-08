import { useState } from "react";
import { PageId } from "../types/navigation";

/** Tracks which sidebar page is currently active. */
export function useNavigation(initialPage: PageId = "home") {
  const [activePage, setActivePage] = useState<PageId>(initialPage);
  return { activePage, setActivePage };
}
