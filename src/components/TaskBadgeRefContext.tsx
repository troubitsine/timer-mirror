/**
 * TaskBadgeRefContext - Context for sharing taskBadgeRef from SessionFrame
 * Used by components that need custom badge placement inside SessionFrame
 */
import { createContext, useContext } from "react";

export const TaskBadgeRefContext = createContext<React.RefObject<HTMLDivElement> | null>(null);

/** Hook to access taskBadgeRef from SessionFrame for custom badge rendering */
export function useTaskBadgeRef() {
  const ref = useContext(TaskBadgeRefContext);
  if (!ref) {
    throw new Error("useTaskBadgeRef must be used within SessionFrame");
  }
  return ref;
}
