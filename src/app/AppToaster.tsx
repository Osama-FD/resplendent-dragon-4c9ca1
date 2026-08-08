import * as React from "react";
import { Toaster } from "@fluentui/react-components";

/** Shared id linking every useAppToast() call to the single <AppToaster /> mounted in App.tsx. */
export const APP_TOASTER_ID = "app-toaster";

/** Mounted once at the app root. Renders nothing visible until a toast is dispatched. */
export const AppToaster: React.FC = () => <Toaster toasterId={APP_TOASTER_ID} position="top-end" />;
