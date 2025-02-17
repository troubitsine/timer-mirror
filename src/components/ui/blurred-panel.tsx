import { cn } from "@/lib/utils";

interface BlurredPanelProps {
  children: React.ReactNode;
  className?: string;
}

const BlurredPanel = ({ children, className }: BlurredPanelProps) => {
  return (
    <div className={cn("relative isolate", className)}>
      <div className="relative">
        {/* Background layer to force blur isolation */}
        <div className="absolute inset-0 bg-black/15 backdrop-blur-lg rounded-xl" />

        {/* Content */}
        {children}

        {/* Gradient overlay for border effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-xl blur-sm" />
      </div>
    </div>
  );
};

export default BlurredPanel;
