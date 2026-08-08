import * as React from "react";

interface CurrentEstimateContextValue {
  currentEstimateId: string | undefined;
  setCurrentEstimateId: (id: string | undefined) => void;
}

const CurrentEstimateContext = React.createContext<CurrentEstimateContextValue | undefined>(undefined);

/**
 * Tracks which saved Estimate is "current" (open in the New Estimate
 * builder, or just generated) so the My Estimates page can highlight the
 * matching card - the only way to share that across pages without either
 * page reaching into the other's local state.
 */
export const CurrentEstimateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentEstimateId, setCurrentEstimateId] = React.useState<string | undefined>(undefined);
  const value = React.useMemo(() => ({ currentEstimateId, setCurrentEstimateId }), [currentEstimateId]);

  return <CurrentEstimateContext.Provider value={value}>{children}</CurrentEstimateContext.Provider>;
};

export function useCurrentEstimate(): CurrentEstimateContextValue {
  const context = React.useContext(CurrentEstimateContext);
  if (!context) {
    throw new Error("useCurrentEstimate must be used within a CurrentEstimateProvider");
  }
  return context;
}
