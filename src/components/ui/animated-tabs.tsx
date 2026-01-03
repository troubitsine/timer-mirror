import { cn } from "@/lib/utils";
import { AnimatePresence, Transition, motion } from "framer-motion";
import { Children, ReactElement, useState, useId, ReactNode } from "react";

type AnimatedTabsProps = {
  children:
    | ReactElement<{ "data-id": string; className?: string; children: ReactNode }>[]
    | ReactElement<{ "data-id": string; className?: string; children: ReactNode }>;
  defaultValue?: string;
  onValueChange?: (newActiveId: string | null) => void;
  className?: string;
  transition?: Transition;
  enableHover?: boolean;
};

export default function AnimatedTabs({
  children,
  defaultValue,
  onValueChange,
  className,
  transition,
  enableHover = false,
}: AnimatedTabsProps) {
  const [activeId, setActiveId] = useState<string | null>(
    () => defaultValue ?? null,
  );
  const uniqueId = useId();

  const handleSetActiveId = (id: string | null) => {
    setActiveId(id);

    if (onValueChange) {
      onValueChange(id);
    }
  };

  return Children.map(children, (child, index) => {
    const id = child.props["data-id"];
    const isActive = activeId === id;

    const handleClick = () => handleSetActiveId(id);
    const handleMouseEnter = enableHover
      ? () => handleSetActiveId(id)
      : undefined;
    const handleMouseLeave = enableHover
      ? () => handleSetActiveId(null)
      : undefined;

    return (
      <button
        key={index}
        type="button"
        className={cn("relative inline-flex", child.props.className)}
        aria-selected={isActive}
        data-checked={isActive ? "true" : "false"}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence initial={false}>
          {isActive && (
            <motion.div
              layoutId={`background-${uniqueId}`}
              className={cn("absolute inset-0", className)}
              transition={transition}
              initial={{ opacity: defaultValue ? 1 : 0 }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
            />
          )}
        </AnimatePresence>
        <span className="z-10 relative">{child.props.children}</span>
      </button>
    );
  });
}
