import * as React from "react";

interface ErrorBoundaryState {
  error?: Error;
}

/**
 * Last-resort fallback for the whole app. Error Boundaries must be class
 * components - there is no hooks equivalent. Only catches errors thrown
 * during render/lifecycle of its children (not event handlers or async
 * code); the goal here is simply to avoid a blank task pane if something
 * unexpected slips through.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Unhandled error in Electrical Estimator:", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 24,
            height: "100vh",
            boxSizing: "border-box",
            fontFamily: "Segoe UI, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <strong style={{ fontSize: 16 }}>Something went wrong</strong>
          <span style={{ color: "#666" }}>
            The task pane hit an unexpected error and couldn't continue. Your saved materials,
            settings, and estimates are unaffected - try closing and reopening the task pane.
          </span>
        </div>
      );
    }

    return this.props.children;
  }
}
