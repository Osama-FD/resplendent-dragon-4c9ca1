import * as React from "react";
import { Body1 } from "@fluentui/react-components";
import { PageShell } from "../PageShell";

/** Placeholder for future multi-project support (see PROJECT_SPEC.md "Future Ready"). */
export const Projects: React.FC = () => {
  return (
    <PageShell title="Projects" description="Browse and switch between saved projects.">
      <Body1>Project listing will be implemented in a later phase.</Body1>
    </PageShell>
  );
};
