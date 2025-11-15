// ShareWatermark.tsx
// Shared watermark overlay for export surfaces to keep branding consistent.
import React from "react";
import { cn } from "@/lib/utils";

interface ShareWatermarkProps {
  scale?: number;
  className?: string;
}

const ShareWatermark = ({
  scale = 1,
  className,
}: ShareWatermarkProps) => {
  return (
    <div
      data-share-watermark
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center z-40",
        className,
      )}
    >
      <div className="inline-flex">
        <div
          className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 text-xs font-medium leading-tight rounded-full inner-stroke-white-20-sm pl-3 pr-2.5 pt-1 pb-[0.3rem]"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "bottom center",
            maxWidth: "480px",
            overflowWrap: "break-word",
            whiteSpace: "normal",
            textWrap: "balance",
          }}
        >
          focus-reel.app
        </div>
      </div>
    </div>
  );
};

export default ShareWatermark;
