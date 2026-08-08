import * as React from "react";
import { Card, CardHeader, Text, Body1, makeStyles, tokens } from "@fluentui/react-components";
import { DocumentAdd24Regular, Options24Regular, Box24Regular } from "@fluentui/react-icons";
import { PageShell } from "../PageShell";

const useStyles = makeStyles({
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: tokens.spacingVerticalS,
  },
  cardBody: {
    color: tokens.colorNeutralForeground3,
  },
});

export const Home: React.FC = () => {
  const styles = useStyles();

  return (
    <PageShell title="Welcome" description="Get started with electrical estimating in three steps.">
      <div className={styles.grid}>
        <Card>
          <CardHeader
            image={<Options24Regular />}
            header={<Text weight="semibold">1. Set up your project</Text>}
          />
          <Body1 className={styles.cardBody}>
            Enter your project name, MP prices, and OH/Margin percentages on the Setup page.
          </Body1>
        </Card>
        <Card>
          <CardHeader
            image={<Box24Regular />}
            header={<Text weight="semibold">2. Manage your materials</Text>}
          />
          <Body1 className={styles.cardBody}>
            Add pipes, cables, and accessories in Material Manager - they show up automatically in
            New Estimate.
          </Body1>
        </Card>
        <Card>
          <CardHeader
            image={<DocumentAdd24Regular />}
            header={<Text weight="semibold">3. Generate an estimate</Text>}
          />
          <Body1 className={styles.cardBody}>
            Build a New Estimate and generate a fully formatted, calculated table in Excel.
          </Body1>
        </Card>
      </div>
    </PageShell>
  );
};
