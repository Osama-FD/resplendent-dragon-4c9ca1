import { createRoot } from "react-dom/client";
import { App } from "../app/App";
import { ErrorBoundary } from "../app/ErrorBoundary";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found.");
}

const root = createRoot(container);

Office.onReady(() => {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
});
