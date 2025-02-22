import * as React from "react";
import { Slider } from "./slider";

interface SliderWithTicksProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
}

export function SliderWithTicks({
  min = 0,
  max = 100,
  step = 1,
  value = [0],
  onValueChange,
  className,
}: SliderWithTicksProps) {
  const ticks = React.useMemo(() => {
    const count = (max - min) / step;
    return Array.from({ length: count + 1 }, (_, i) => min + i * step);
  }, [min, max, step]);

  return (
    <div className="relative w-full">
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        className={className}
      />
      <div className="absolute w-full flex justify-between px-1 mt-1">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="h-1 w-0.5 bg-gray-300"
            style={{ transform: "translateX(-50%)" }}
          />
        ))}
      </div>
    </div>
  );
}
