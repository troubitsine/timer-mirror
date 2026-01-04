/**
 * SessionFrame - Shared wrapper for session montage/grid views
 * Owns dynamic background, backdrop overlay, badge, controls, and watermark
 */
import React, { ReactNode, forwardRef } from "react";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import BackgroundColorSelector from "./BackgroundColorSelector";
import { cn } from "@/lib/utils";
import { useDynamicBackground } from "@/lib/useDynamicBackground";
import ShareWatermark from "./ShareWatermark";
import { TaskBadgeRefContext } from "./TaskBadgeRefContext";

interface SessionFrameProps {
  /** Image source for dynamic color extraction */
  imageSrc: string | null;
  /** Task name for badge */
  taskName?: string;
  /** Duration in minutes for badge */
  duration?: number;
  /** Initial background selection ID */
  initialSelectedBackgroundId?: string;
  /** Callback when background selection changes */
  onBackgroundSelect?: (id: string) => void;
  /** Hide controls (background selector, replay button) */
  hideControls?: boolean;
  /** Custom badge slot - if provided, replaces default badge */
  badgeSlot?: ReactNode;
  /** Render badge at bottom instead of top */
  badgePosition?: "top" | "bottom" | "none";
  /** Scale factor for badge on desktop */
  badgeScale?: number;
  /** Additional controls slot (e.g. replay button) */
  controlsSlot?: ReactNode;
  /** Analytics surface for background selection */
  backgroundSurface?: string;
  /** Main content */
  children: ReactNode;
  /** Additional className for root Card */
  className?: string;
  /** data attribute for share export */
  dataShareSurface?: string;
}

const SessionFrame = forwardRef<HTMLDivElement, SessionFrameProps>(
  (
    {
      imageSrc,
      taskName = "Focus Session",
      duration = 25,
      initialSelectedBackgroundId,
      onBackgroundSelect,
      hideControls = false,
      badgeSlot,
      badgePosition = "top",
      badgeScale = 1,
      controlsSlot,
      backgroundSurface,
      children,
      className,
      dataShareSurface,
    },
    ref
  ) => {
    const {
      selectedBackground,
      selectedBackgroundId,
      setSelectedBackgroundId,
      backgroundOptions,
      hasDynamicColors,
      taskBadgeRef,
    } = useDynamicBackground(
      imageSrc,
      initialSelectedBackgroundId,
      onBackgroundSelect
    );

    const exportBackgroundStyle = { ...(selectedBackground?.style ?? {}) };

    const renderBadge = () => {
      if (badgePosition === "none") return null;

      if (badgeSlot) return badgeSlot;

      return (
        <motion.div
          className={cn(
            "absolute w-full text-center z-20",
            badgePosition === "top" ? "top-3" : "bottom-3"
          )}
          style={
            badgeScale !== 1
              ? {
                  transform: `scale(${badgeScale})`,
                  transformOrigin:
                    badgePosition === "top" ? "top center" : "bottom center",
                }
              : undefined
          }
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 22,
            delay: 0.05,
          }}
        >
          <div className="inline-flex bg-white/80 p-1 rounded-xl mx-2">
            <div
              ref={taskBadgeRef}
              className="task-badge text-neutral-50/90 inner-stroke-white-20-sm"
              style={{
                textShadow: "1px 1.5px 2px rgba(0,0,0,0.28)",
                maxWidth: "480px",
                overflowWrap: "break-word",
                whiteSpace: "normal",
                textWrap: "balance",
              }}
            >
              {taskName} • {duration} min
            </div>
          </div>
        </motion.div>
      );
    };

    return (
      <Card
        ref={ref}
        data-share-export-root
        data-share-surface={dataShareSurface}
        className={cn(
          "w-full h-full relative border-0 overflow-hidden rounded-[18px]",
          selectedBackground?.className,
          className
        )}
        style={exportBackgroundStyle}
      >
        {/* Backdrop overlay for gradient rendering */}
        {selectedBackground?.className ? (
          <div
            aria-hidden="true"
            data-share-surface={dataShareSurface}
            className={cn(
              "absolute inset-0 pointer-events-none rounded-[inherit]",
              selectedBackground.className
            )}
            style={exportBackgroundStyle}
          />
        ) : null}

        {/* Badge */}
        {renderBadge()}

        {/* Main content - wrapped in context for custom badge access */}
        <TaskBadgeRefContext.Provider value={taskBadgeRef}>
          {children}
        </TaskBadgeRefContext.Provider>

        {/* Background color selector */}
        {hasDynamicColors && !hideControls && (
          <div
            className="absolute bottom-3.5 left-4 flex justify-center z-30"
            data-export-exclude="true"
          >
            <BackgroundColorSelector
              options={backgroundOptions}
              selectedId={selectedBackgroundId}
              onSelect={setSelectedBackgroundId}
              surface={backgroundSurface}
              className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
            />
          </div>
        )}

        {/* Additional controls slot (e.g. replay button) */}
        {!hideControls && controlsSlot}

        {/* Watermark */}
        <ShareWatermark />
      </Card>
    );
  }
);

SessionFrame.displayName = "SessionFrame";

export default SessionFrame;
