// components/ui/AnimatedShinyText.tsx - Text shimmer for buttons with dynamic accent support.
import { CSSProperties, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedShinyTextProps {
  children: ReactNode;
  className?: string;
  shimmerWidth?: number;
  shimmerColor?: string;
  baseColor?: string;
}

const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 120,
  shimmerColor = "rgba(0, 0, 0, 0.75)",
  baseColor = "rgba(0, 0, 0, 0.7)",
}) => {
  const style = {
    "--shiny-width": `${shimmerWidth}px`,
    "--shiny-base": baseColor,
    "--shiny-color": shimmerColor,
  } as CSSProperties;

  return (
    <span
      style={style}
      className={cn(
        "inline-flex bg-clip-text text-transparent",
        "bg-no-repeat [background-position:-200%_0,0_0] [background-size:var(--shiny-width)_100%,100%]",
        "[background-image:linear-gradient(90deg,transparent,transparent,var(--shiny-color),transparent,transparent),linear-gradient(var(--shiny-base),var(--shiny-base))]",
        "animate-shiny-text",
        className,
      )}
    >
      {children}
    </span>
  );
};

export { AnimatedShinyText };
