import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RotateCw } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { isMobileDevice } from "@/lib/deviceDetection";
import BackgroundColorSelector from "./BackgroundColorSelector";
import { cn } from "@/lib/utils";
import { useDynamicBackground } from "@/lib/useDynamicBackground";

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

type CardState = {
  id: number;
  src: string;
  pos: number;
  z: number;
  rot: number;
};

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
  const isMobile = isMobileDevice();
  const foregroundScale = isMobile ? 1 : 0.67;

  // Helper function to interleave two arrays
  const interleaveArrays = (arr1: string[], arr2: string[]): string[] => {
    const result: string[] = [];
    const maxLength = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < maxLength; i++) {
      if (arr1[i]) result.push(arr1[i]);
      if (arr2[i]) result.push(arr2[i]);
    }
    return result;
  };

  // Determine which photos to use based on device and available data
  const allPhotos = useMemo(() => {
    // Simple filter for valid images
    const validScreenshots = screenshots.filter((s) => s && s.length > 0);
    const validWebcamPhotos = webcamPhotos.filter((p) => p && p.length > 0);

    console.log(
      `Valid screenshots: ${validScreenshots.length}, Valid webcam photos: ${validWebcamPhotos.length}`,
    );

    // Check if we have valid screenshots available
    const hasScreenshots = validScreenshots.length > 0;

    if (isMobile || !hasScreenshots) {
      // On mobile or when no valid screenshots are available, only use webcam photos
      return [...validWebcamPhotos];
    } else {
      // For desktop with valid screenshots, interleave screenshots and webcam photos
      return interleaveArrays(validScreenshots, validWebcamPhotos);
    }
  }, [screenshots, webcamPhotos, isMobile]);

  // Get the last photo for color extraction
  const lastPhoto = useMemo(() => {
    // First, filter out any empty strings or invalid entries - simplified
    const validScreenshots = screenshots.filter(Boolean);
    const validWebcamPhotos = webcamPhotos.filter(Boolean);

    // Check if we have valid screenshots available
    const hasScreenshots = validScreenshots.length > 0;

    if (isMobile || !hasScreenshots) {
      // On mobile or when no valid screenshots are available, use the last webcam photo
      return validWebcamPhotos.length > 0
        ? validWebcamPhotos[validWebcamPhotos.length - 1]
        : null;
    } else {
      // On desktop with valid screenshots, prefer the last screenshot, fallback to webcam photo
      return validScreenshots.length > 0
        ? validScreenshots[validScreenshots.length - 1]
        : validWebcamPhotos.length > 0
          ? validWebcamPhotos[validWebcamPhotos.length - 1]
          : null;
    }
  }, [screenshots, webcamPhotos, isMobile]);

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

  // Animation config
  const H_X_STEP = 4; // horizontal distance between stacked cards

  // Calculate number of cards based on available photos
  const numberOfCards = Math.min(allPhotos.length, 12); // Limit to 12 cards max

  // Card dimensions based on aspect ratio and device type
  // Calculate card width as a percentage of container width
  const widthPercentage = { "16:9": 0.45, "1:1": 0.7, "9:16": 0.75 }[
    aspectRatio
  ];
  // Use a percentage of the container width instead of a fixed value
  const CARD_W_PERCENT = Math.round(widthPercentage * 100);
  // Apply 4:3 ratio on desktop and 4:5 on mobile
  const CARD_AR = isMobile ? "4 / 5" : "4 / 3";

  // Calculate the base X position to center the stack horizontally
  const HR_BASE_X = -((numberOfCards - 1) * H_X_STEP) / 2;

  const randRot = useCallback(() => (Math.random() - 0.5) * 8, []);

  const buildCards = useCallback(
    (): CardState[] =>
      Array.from({ length: numberOfCards }, (_, i) => ({
        id: i + 1,
        src: allPhotos[i % allPhotos.length], // each card keeps its own photo
        pos: i,
        z: numberOfCards - i,
        rot: randRot(),
      })),
    [allPhotos, numberOfCards, randRot],
  );

  const [cards, setCards] = useState<CardState[]>(() => buildCards());

  const [movingId, setMovingId] = useState<number | null>(null);
  const controls = useAnimation();
  // --- Pose helpers ---------------------------------------------------
  const basePose = useCallback(
    (c: CardState) => ({
      x: HR_BASE_X + c.pos * H_X_STEP,
      y: 0, // Changed from -10 to 0 for true centering
      rotate: c.rot,
      zIndex: c.z,
    }),
    [HR_BASE_X, H_X_STEP],
  );

  const liftPose = useCallback(
    (c: CardState) => ({
      ...basePose(c),
      y: -24, // Adjusted from -34
      rotate: c.rot + 6,
      zIndex: 200,
      scale: 0.96,
      opacity: 1,
      transition: { type: "spring", stiffness: 320, damping: 32 },
    }),
    [basePose],
  );

  const peelPose = useCallback(
    (c: CardState) => ({
      ...basePose(c),
      x: basePose(c).x + 120,
      y: 20,
      rotate: c.rot + 18,
      zIndex: 0,
      scale: 0.9,
      opacity: 1,
      transition: { type: "spring", stiffness: 260, damping: 22 },
    }),
    [basePose],
  );

  const backPose = useCallback(
    (len: number) => ({
      x: HR_BASE_X + (len - 1) * H_X_STEP,
      y: -10, // Adjusted from -20
      rotate: 0,
      scale: 1,
      opacity: 1,
      zIndex: 1,
      transition: { type: "spring", stiffness: 300, damping: 22 },
    }),
    [HR_BASE_X, H_X_STEP],
  );

  // --- Shuffle cycle --------------------------------------------------
  const shuffle = useCallback(async () => {
    const top = cards.find((c) => c.pos === 0);
    if (!top) return;

    setMovingId(top.id);
    await controls.start(liftPose(top));
    await controls.start(peelPose(top));
    await controls.start(backPose(cards.length));

    setCards((prev) => {
      const next = prev.map((o) => ({ ...o }));
      next.forEach((c) => {
        if (c.id !== top.id) {
          c.pos -= 1;
          c.z += 1;
        }
      });
      const moving = next.find((c) => c.id === top.id);
      if (moving) {
        moving.pos = next.length - 1;
        moving.z = 1;
        moving.rot = randRot();
      }
      return next;
    });

    setMovingId(null);
  }, [backPose, cards, controls, liftPose, peelPose, randRot]);

  // Start the animation sequence
  const startAnimation = useCallback(() => {
    setCards(buildCards());
  }, [buildCards]);

  return (
    <Card
      data-share-surface="backdrop"
      className={cn(
        "w-full h-full relative border-0",
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
            {numberOfCards > 0 && (
              <div
                className="relative h-full w-full flex items-center justify-center"
                style={
                  !isMobile
                    ? {
                        transform: `scale(${foregroundScale})`,
                        transformOrigin: "center",
                      }
                    : undefined
                }
              >
                <motion.div
                  className="relative h-full w-full flex items-center justify-center"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onTap={shuffle}
                >
                  {/* Card stack */}
                  {cards.map((card, _index) => {
                    return (
                      <motion.div
                        key={`photo-${card.id}`}
                        className="absolute"
                        style={{
                          width: `${CARD_W_PERCENT}%`,
                          aspectRatio: CARD_AR,
                          left: 0,
                          top: 12,
                          bottom: 0,
                          right: 0,
                          margin: "auto",
                        }}
                        initial={basePose(card)}
                        animate={card.id === movingId ? controls : basePose(card)}
                      >
                        <div
                          className={cn(
                            "overflow-hidden w-full h-full bg-white inner-stroke-black-5-sm",
                            aspectRatio === "9:16"
                              ? "p-[3px] rounded-[10px]"
                              : "p-[5px] rounded-[15px]",
                          )}
                        >
                          <img
                            src={card.src}
                            alt={`Photo ${card.id}`}
                            loading="eager"
                            decoding="async"
                            className={cn(
                              "w-full h-full object-cover z-30 shadow-[0_1px_2px_rgba(0,0,0,0.14),_0_8px_8px_rgba(0,0,0,0.04)]",
                              aspectRatio === "9:16"
                                ? "rounded-[7px]"
                                : "rounded-[11px]",
                            )}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}
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
            className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
          />
        </div>
      )}

      {/* Replay button - only show when controls aren't hidden */}
      {!hideControls && (
        <motion.div
          className="absolute bottom-4 right-3 z-30"
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
            onClick={startAnimation}
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
