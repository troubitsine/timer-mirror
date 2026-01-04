import React, { useEffect, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import BackgroundColorSelector from "./BackgroundColorSelector";
import { cn } from "@/lib/utils";
import { useDynamicBackground } from "@/lib/useDynamicBackground";
import { useSessionMedia } from "@/lib/useSessionMedia";
import CardStack, { CardStackRef } from "./CardStack";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

interface ShareSessionMontageProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  onSave?: () => void;
  initialSelectedBackgroundId?: string;
  onBackgroundSelect?: (id: string) => void;
  hideControls?: boolean;
  selectedBackgroundId?: string;
  setSelectedBackgroundId?: (id: string) => void;
  aspectRatio?: "16:9" | "1:1" | "9:16";
}

const ShareSessionMontage = ({
  screenshots = [],
  webcamPhotos = [],
  taskName = "Focus Session",
  duration = 25,
  onSave: _onSave = () => {},
  initialSelectedBackgroundId,
  onBackgroundSelect,
  hideControls = false,
  selectedBackgroundId: externalSelectedBackgroundId,
  setSelectedBackgroundId: _externalSetSelectedBackgroundId,
  aspectRatio = "16:9",
}: ShareSessionMontageProps) => {
  // Use shared media hook
  const { allPhotos, lastPhoto, numberOfCards, isMobile } = useSessionMedia({
    screenshots,
    webcamPhotos,
  });
  const foregroundScale = isMobile ? 1 : 0.67;
  const cardStackRef = useRef<CardStackRef>(null);

  // Use the dynamic background hook with initial selection and callback
  const {
    selectedBackground,
    selectedBackgroundId,
    setSelectedBackgroundId,
    backgroundOptions,
    hasDynamicColors,
    taskBadgeRef,
  } = useDynamicBackground(
    lastPhoto,
    initialSelectedBackgroundId,
    onBackgroundSelect,
  );

  const exportBackgroundStyle = { ...(selectedBackground?.style ?? {}) };

  // Use external selectedBackgroundId and setSelectedBackgroundId if provided
  useEffect(() => {
    if (
      externalSelectedBackgroundId &&
      externalSelectedBackgroundId !== selectedBackgroundId
    ) {
      setSelectedBackgroundId(externalSelectedBackgroundId);
    }
  }, [
    externalSelectedBackgroundId,
    selectedBackgroundId,
    setSelectedBackgroundId,
  ]);

  // Reset the card stack
  const handleReset = () => {
    trackEvent(ANALYTICS_EVENTS.SHARE_REPLAY, { surface: "share_montage" });
    cardStackRef.current?.reset();
  };

  return (
    <Card
      data-share-surface="backdrop"
      className={cn(
        "w-full h-full relative border-0 shadow-none inner-stroke-white-20-sm",
        selectedBackground?.className,
      )}
      style={exportBackgroundStyle}
    >
      {selectedBackground?.className ? (
        <div
          data-share-surface="backdrop"
          aria-hidden="true"
          className={cn(
            "absolute inset-0 pointer-events-none",
            selectedBackground.className,
          )}
          style={exportBackgroundStyle}
        />
      ) : null}
      {/* Session info displayed at the top of the card - absolutely positioned */}
      <div
        className="absolute top-3 w-full text-center z-20"
        style={
          !isMobile
            ? {
                transform: `scale(${foregroundScale})`,
                transformOrigin: "top center",
              }
            : undefined
        }
      >
        <motion.div
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
              {taskName} • {duration} {duration === 1 ? "min" : "min"}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main content container - now using absolute positioning for true centering */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative w-full max-w-full"
          style={{ maxHeight: "calc(100% - 80px)" }}
        >
          <div className="relative w-full mx-auto">
            {/* Photo stack animation */}
            <CardStack
              ref={cardStackRef}
              photos={allPhotos}
              numberOfCards={numberOfCards}
              isMobile={isMobile}
              aspectRatio={aspectRatio}
              scale={isMobile ? 1 : foregroundScale}
            />
          </div>
        </div>
      </div>

      {/* Background color selector - only show when dynamic colors are available and controls aren't hidden */}
      {hasDynamicColors && !hideControls && (
        <div className="absolute bottom-3.5 left-4 flex justify-center z-30">
          <BackgroundColorSelector
            options={backgroundOptions}
            selectedId={selectedBackgroundId}
            onSelect={setSelectedBackgroundId}
            surface="share_montage"
            className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
          />
        </div>
      )}

      {/* Replay button - only show when controls aren't hidden */}
      {!hideControls && (
        <motion.div
          className="absolute bottom-4 right-4 z-30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReset}
            className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/70 backdrop-blur-md flex items-center gap-1 rounded-full inner-stroke-white-20-sm sm:pl-[8px] sm:pr-[10px] py-[6px] pl-[10px] pr-[12px]"
          >
            <RotateCw className="h-4 w-4" />
            <span className="hidden sm:inline">Replay</span>
          </Button>
        </motion.div>
      )}
    </Card>
  );
};

export default ShareSessionMontage;
