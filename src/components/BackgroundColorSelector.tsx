import React from "react";
import { cn } from "@/lib/utils";

export type BackgroundOption = {
  id: string;
  name: string;
  style?: React.CSSProperties;
  className?: string;
};

interface BackgroundColorSelectorProps {
  options: BackgroundOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

const BackgroundColorSelector = ({
  options,
  selectedId,
  onSelect,
  className,
}: BackgroundColorSelectorProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            "w-8 h-8 rounded-full transition-all",
            "ring-offset-2 ring-offset-white/10",
            selectedId === option.id
              ? "ring-2 ring-white scale-110"
              : "ring-1 ring-white/30",
            option.className,
          )}
          style={option.style}
          title={option.name}
          aria-label={option.name}
        />
      ))}
    </div>
  );
};

export default BackgroundColorSelector;
