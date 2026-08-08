import * as React from "react";
import { Text, makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  heading: {
    display: "block",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: tokens.colorBrandForeground1,
  },
});

interface SectionHeadingProps {
  children: React.ReactNode;
}

/**
 * Small-caps "eyebrow" heading used everywhere content is split into named
 * sections (Material Manager/Setup's Pipes/Cables/Accessories groups, the
 * Calculation Preview's First Fix/Second Fix/Summary) so every section
 * label in the app looks the same instead of each page styling its own.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({ children }) => {
  const styles = useStyles();
  return <Text className={styles.heading}>{children}</Text>;
};
