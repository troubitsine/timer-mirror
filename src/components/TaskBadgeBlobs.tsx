// TaskBadgeBlobs.tsx
// Task badge overlay that adds mini accent blobs to match montage/glow styling.
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { isMobileDevice } from "@/lib/deviceDetection";
import { BlobGradients, buildBlobGradients } from "@/lib/blobGradients";

const FALLBACK_ACCENT_COLOR = "#ffffff";

type BlobKey = keyof BlobGradients;

type BlobConfig = {
  key: BlobKey;
  className: string;
  opacity: number;
  animationClass: string;
};

const BLOB_CONFIG: BlobConfig[] = [
  {
    key: "primary",
    className: "left-[-3%] -bottom-[110%] w-[82%] h-[170%]",
    opacity: 0.9,
    animationClass:
      "motion-safe:animate-[session-blob-float-1_18s_ease-in-out_infinite] motion-reduce:animate-none",
  },
  {
    key: "secondary",
    className: "right-[14%] -bottom-[85%] w-[66%] h-[160%]",
    opacity: 0.87,
    animationClass:
      "motion-safe:animate-[session-blob-float-2_16s_ease-in-out_infinite] motion-reduce:animate-none",
  },
  {
    key: "tertiary",
    className: "left-[40%] -bottom-[125%] w-[60%] h-[180%]",
    opacity: 0.85,
    animationClass:
      "motion-safe:animate-[session-blob-float-3_20s_ease-in-out_infinite] motion-reduce:animate-none",
  },
];

const TaskBadgeBlobs = ({ accentColor }: { accentColor?: string }) => {
  const gradients = useMemo(
    () => buildBlobGradients(accentColor || FALLBACK_ACCENT_COLOR),
    [accentColor],
  );
  const isMobile = isMobileDevice();

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] pointer-events-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 blur-sm">
        {BLOB_CONFIG.map((blob) => (
          <div
            key={blob.key}
            className={cn(
              "absolute rounded-full",
              blob.className,
              isMobile ? "animate-none" : blob.animationClass,
            )}
            style={{ background: gradients[blob.key], opacity: blob.opacity }}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskBadgeBlobs;
