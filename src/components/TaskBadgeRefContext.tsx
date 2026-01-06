/**
 * TaskBadgeRefContext - Shares task badge ref and accent color from SessionFrame.
 * Used by components that render custom badge placement inside SessionFrame.
 */
import { createContext, useContext } from "react";

type TaskBadgeContextValue = {
  ref: React.RefObject<HTMLDivElement>;
  accentColor?: string;
};

export const TaskBadgeRefContext =
  createContext<TaskBadgeContextValue | null>(null);

/** Hook to access taskBadgeRef from SessionFrame for custom badge rendering */
export function useTaskBadgeRef() {
  const context = useContext(TaskBadgeRefContext);
  if (!context) {
    throw new Error("useTaskBadgeRef must be used within SessionFrame");
  }
  return context.ref;
}

/** Hook to access accent color for task badge blobs */
export function useTaskBadgeAccentColor(fallback = "#ffffff") {
  const context = useContext(TaskBadgeRefContext);
  if (!context) {
    throw new Error("useTaskBadgeAccentColor must be used within SessionFrame");
  }
  return context.accentColor ?? fallback;
}
