import * as React from "react";
import { FluentProvider, webLightTheme, makeStyles, tokens } from "@fluentui/react-components";
import { Sidebar } from "../components/Navigation/Sidebar";
import { TopBar } from "../components/Navigation/TopBar";
import { Home } from "../components/Home/Home";
import { Setup } from "../components/Setup/Setup";
import { PriceManager } from "../components/PriceManager/PriceManager";
import { NewEstimate } from "../components/NewEstimate/NewEstimate";
import { MyEstimates } from "../components/MyEstimates/MyEstimates";
import { Projects } from "../components/Projects/Projects";
import { Settings } from "../components/Settings/Settings";
import { useNavigation } from "../hooks/useNavigation";
import { PageId } from "../types/navigation";
import { AppToaster } from "./AppToaster";
import { CurrentEstimateProvider } from "./CurrentEstimateContext";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  content: {
    flex: 1,
    overflowY: "auto",
  },
});

const PAGES: Record<PageId, React.FC> = {
  home: Home,
  newEstimate: NewEstimate,
  myEstimates: MyEstimates,
  setup: Setup,
  materialManager: PriceManager,
  projects: Projects,
  settings: Settings,
};

/** App shell: theming, sidebar navigation, and the currently active page. */
export const App: React.FC = () => {
  const styles = useStyles();
  const { activePage, setActivePage } = useNavigation("home");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const ActivePageComponent = PAGES[activePage];

  return (
    <FluentProvider theme={webLightTheme} className={styles.root}>
      <CurrentEstimateProvider>
        <AppToaster />
        <TopBar activePage={activePage} onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar
          open={sidebarOpen}
          activePage={activePage}
          onNavigate={setActivePage}
          onOpenChange={setSidebarOpen}
        />
        <main className={styles.content}>
          <ActivePageComponent />
        </main>
      </CurrentEstimateProvider>
    </FluentProvider>
  );
};
