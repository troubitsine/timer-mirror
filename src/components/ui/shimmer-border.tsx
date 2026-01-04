// Animated shimmer border wrapper component
import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerBorderProps {
  children: React.ReactNode;
  shimmerColor: string;
  /** "dark" = mostly black with accent color, "light" = mostly accent with white */
  variant?: "dark" | "light";
  className?: string;
  speed?: string;
}

export function ShimmerBorder({
  children,
  shimmerColor,
  variant = "dark",
  className,
  speed = "4s",
}: ShimmerBorderProps) {
  const borderShimmer =
    variant === "dark"
      ? `color-mix(in srgb, rgba(0, 0, 0, 0.35) 60%, ${shimmerColor})`
      : `color-mix(in srgb, ${shimmerColor} 89%, rgba(255, 255, 255, 0.7))`;

  const trackColor =
    variant === "dark" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.3)";

  return (
    <div
      className={cn("relative z-0 inline-flex rounded-full p-[2px]", className)}
      style={
        {
          "--shimmer-color": shimmerColor,
          "--border-shimmer": borderShimmer,
          "--shimmer-speed": speed,
          "--track-color": trackColor,
        } as React.CSSProperties
      }
    >
      {/* Track - constant background border */}
      <div
        className="absolute inset-0 -z-20 rounded-full"
        style={{ background: "var(--track-color)" }}
      />
      {/* Border shimmer - spinning conic gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-full">
        <div className="absolute -inset-full animate-spin-around [background:conic-gradient(from_270deg,transparent_0deg,var(--border-shimmer)_60deg,transparent_120deg)]" />
      </div>
      {children}
    </div>
  );
}
