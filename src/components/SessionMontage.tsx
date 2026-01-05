// SessionMontage.tsx
// Session montage card; orchestrates animation and background selection for session recap.
import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import BackgroundColorSelector from "./BackgroundColorSelector";
import { cn } from "@/lib/utils";
import { useDynamicBackground } from "@/lib/useDynamicBackground";
import { useSessionMedia } from "@/lib/useSessionMedia";
import ShareWatermark from "./ShareWatermark";
import UnifiedPhotoAnimation from "./UnifiedPhotoAnimation";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

interface SessionMontageProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  initialSelectedBackgroundId?: string;
  onBackgroundSelect?: (id: string) => void;
  onAccentColorChange?: (color?: string) => void;
  hideControls?: boolean;
  exportRef?: React.RefObject<HTMLDivElement>;
}

const hashToSeed = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
};

const SessionMontage = ({
  screenshots = [],
  webcamPhotos = [],
  taskName = "Focus Session",
  duration = 25,
  initialSelectedBackgroundId,
  onBackgroundSelect,
  onAccentColorChange,
  hideControls = false,
  exportRef,
}: SessionMontageProps) => {
  const componentId = useId();

  // Use shared media hook
  const { allPhotos, lastPhoto, numberOfCards, isMobile } = useSessionMedia({
    screenshots,
    webcamPhotos,
  });

  const circleSeed = useMemo(
    () => hashToSeed(`${componentId}-circle`),
    [componentId],
  );
  const rotationSeed = useMemo(
    () => hashToSeed(`${componentId}-rotation`),
    [componentId],
  );

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

  // Animation states
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "spread" | "collapse" | "pile" | "fadeOut"
  >("initial");
  const animationPhaseRef = useRef(animationPhase);

  useEffect(() => {
    animationPhaseRef.current = animationPhase;
  }, [animationPhase]);

  // Start the animation sequence
  const startAnimation = useCallback(() => {
    const runSequence = () => {
      setAnimationPhase("initial");

      setTimeout(() => {
        setAnimationPhase("spread");

        const spreadDuration = numberOfCards * 80 + 800;
        setTimeout(() => {
          setAnimationPhase("collapse");

          const collapseDuration = numberOfCards * 40 + 400;
          setTimeout(() => {
            setAnimationPhase("pile");
          }, collapseDuration);
        }, spreadDuration);
      }, 500);
    };

    if (animationPhaseRef.current === "pile") {
      setAnimationPhase("fadeOut");
      setTimeout(runSequence, 200);
    } else {
      runSequence();
    }
  }, [numberOfCards]);

  // Auto-start animation on first load or when card count changes
  useEffect(() => {
    if (numberOfCards === 0) return;

    const frame = requestAnimationFrame(() => {
      startAnimation();
    });

    return () => cancelAnimationFrame(frame);
  }, [numberOfCards, startAnimation]);

  useEffect(() => {
    onAccentColorChange?.(selectedBackground?.accentColor);
  }, [onAccentColorChange, selectedBackground?.accentColor]);


  return (
    <Card
      ref={exportRef ?? undefined}
      data-share-export-root
      className={cn(
        "w-full h-full relative border-0 overflow-hidden rounded-[18px] shadow-none inner-stroke-white-10-sm",
        selectedBackground?.className,
      )}
      style={exportBackgroundStyle}
    >
      {selectedBackground?.className ? (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 pointer-events-none rounded-[inherit]",
            selectedBackground.className,
          )}
          style={exportBackgroundStyle}
        />
      ) : null}
      {/* Session info displayed at the top of the card - absolutely positioned */}
      <motion.div
        className="absolute top-3 w-full text-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 22,
          delay: 0.05,
        }}
      >
        <div className="inline-flex bg-white/80 p-1 rounded-xl">
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

      <div className="flex flex-col h-full items-center justify-center">
        <div className="h-[260px] w-full max-w-[500px] flex items-center justify-center mb-5">
          {numberOfCards > 0 && (
            <UnifiedPhotoAnimation
              photos={allPhotos}
              numberOfCards={numberOfCards}
              isMobile={isMobile}
              animationPhase={animationPhase as "initial" | "spread" | "collapse" | "pile" | "fadeOut"}
              circleSeed={circleSeed}
              rotationSeed={rotationSeed}
            />
          )}
        </div>

        {/* Background color selector - only show when dynamic colors are available and controls aren't hidden */}
        {hasDynamicColors && !hideControls && (
          <div
            className="absolute bottom-3.5 left-4 flex justify-center z-30"
            data-export-exclude="true"
          >
            <BackgroundColorSelector
              options={backgroundOptions}
              selectedId={selectedBackgroundId}
              onSelect={setSelectedBackgroundId}
              surface="session_montage"
              className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
            />
          </div>
        )}

        {/* Replay button - only show when controls aren't hidden */}
        {!hideControls && (
          <motion.div
            className="absolute top-4 left-4 z-30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            data-export-exclude="true"
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                trackEvent(ANALYTICS_EVENTS.SESSION_REPLAY, {
                  surface: "session_montage",
                });
                startAnimation();
              }}
              className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/70 backdrop-blur-md flex items-center gap-1 rounded-full inner-stroke-white-20-sm sm:pl-[8px] sm:pr-[10px] py-[6px] pl-[10px] pr-[12px]"
            >
              <RotateCw className="h-4 w-4" />
              <span className="hidden sm:inline">Replay</span>
            </Button>
          </motion.div>
        )}
      </div>
      <ShareWatermark />
    </Card>
  );
};

export default SessionMontage;
