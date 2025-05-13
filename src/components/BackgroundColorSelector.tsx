import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BackgroundOption } from "@/lib/useDynamicBackground";

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
  // Find the selected option
  const selectedOption =
    options.find((option) => option.id === selectedId) || options[0];

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-0.5 pl-1 pr-1 py-1 rounded-full bg-gradient-to-b from-white/20 via-neutral-400/30 to-neutral-500/30 backdrop-blur-sm inner-stroke-white-20-sm hover:bg-black/10 transition-colors focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-black/20"
            aria-label="Select background color"
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full transition-all inner-stroke-black-5-sm",

                selectedOption.className,
              )}
              style={selectedOption.style}
            />
            <ChevronDown className="h-4 w-4 text-black/40" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          className="rounded-full bg-black/40 backdrop-blur-sm p-[4px] min-w-0 border-0"
        >
          <div className="flex flex-wrap gap-[8px] p-1 justify-center">
            {options.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => onSelect(option.id)}
                className="p-0 focus:bg-transparent focus:ring-0 outline-none"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full transition-all cursor-pointer inner-stroke-black-5-sm",
                    selectedId === option.id
                      ? "ring-2 ring-white/80"
                      : "ring-2 ring-white/30 hover:ring-white/70",
                    option.className,
                  )}
                  style={option.style}
                  title={option.name}
                  aria-label={option.name}
                />
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BackgroundColorSelector;
