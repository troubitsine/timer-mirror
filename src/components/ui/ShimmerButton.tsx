// components/ui/ShimmerButton.tsx - Frosted glass trigger with reusable shimmer accent.
import React, { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export interface ShimmerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "rgba(255, 255, 255, 0.9)",
      shimmerSize = "2px",
      borderRadius = "999px",
      shimmerDuration = "3s",
      background = "rgba(255, 255, 255, 0.75)",
      className,
      children,
      style,
      ...props
    },
    ref,
  ) => {
    const styleWithVariables: CSSProperties = {
      "--shimmer-color": shimmerColor,
      "--shimmer-cut": shimmerSize,
      "--shimmer-radius": borderRadius,
      "--shimmer-speed": shimmerDuration,
      "--shimmer-bg": background,
      "--shimmer-spread": "90deg",
      ...style,
    } as CSSProperties;

    return (
      <button
        ref={ref}
        style={styleWithVariables}
        className={cn(
          "group relative isolate inline-flex items-center justify-center overflow-hidden whitespace-nowrap align-middle transition-transform duration-200 ease-out transform-gpu active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-visible"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] [background:conic-gradient(from_120deg,transparent_0deg,transparent_110deg,var(--shimmer-color)_180deg,transparent_250deg,transparent_360deg)] [mask:radial-gradient(closest-side,transparent_calc(100%_-_var(--shimmer-cut,2px)),white_calc(100%_-_var(--shimmer-cut,2px)))] [animation:spin_var(--shimmer-speed,3s)_linear_infinite]"
          />
        </div>
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 rounded-[inherit] shadow-[inset_0_-8px_10px_rgba(255,255,255,0.18)] transition-shadow duration-300 ease-in-out group-hover:shadow-[inset_0_-6px_10px_rgba(255,255,255,0.3)] group-active:shadow-[inset_0_-10px_10px_rgba(255,255,255,0.24)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -z-30 rounded-[inherit] [inset:var(--shimmer-cut,0px)] [background:var(--shimmer-bg)]"
        />
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";

export { ShimmerButton };
