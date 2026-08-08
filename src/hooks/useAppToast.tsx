import { useToastController, Toast, ToastTitle, ToastBody } from "@fluentui/react-components";
import { APP_TOASTER_ID } from "../app/AppToaster";

/**
 * App-wide success/error notifications, backed by Fluent's Toast system
 * (auto-dismissing, doesn't shift layout like an inline MessageBar would).
 * Every hook/component that mutates data calls this instead of building
 * its own feedback UI, so notifications look and behave the same everywhere.
 */
export function useAppToast() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);

  const notify = (title: string, intent: "success" | "error", body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, timeout: intent === "error" ? 5000 : 3000 }
    );
  };

  return {
    success: (title: string, body?: string) => notify(title, "success", body),
    error: (title: string, body?: string) => notify(title, "error", body),
  };
}
