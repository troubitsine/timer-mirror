/**
 * SpiralAnimation - Spiral fan-out animation for session photos
 * Displays photos spreading out from center in circular pattern
 */
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpiralAnimationProps {
  photos: string[];
  numberOfCards: number;
  isMobile: boolean;
  animationPhase: "initial" | "spread" | "fadeOut";
  circleSeed: number;
  rotationSeed: number;
}

const createDeterministicRandom = (seed: number) => {
  let currentSeed = seed;
  return () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };
};

const SpiralAnimation = ({
  photos,
  numberOfCards,
  isMobile,
  animationPhase,
  circleSeed,
  rotationSeed,
}: SpiralAnimationProps) => {
  const baseRadius = 100;
  const radiusIncrement = 8;

  // Create circles data structure
  const circlesData = useMemo(() => {
    const random = createDeterministicRandom(circleSeed);
    const circles = [];
    let remainingPhotos = numberOfCards;
    let currentCircle = 0;

    while (remainingPhotos > 0) {
      const photosInThisCircle = Math.min(
        Math.floor(random() * 3) + 4,
        remainingPhotos
      );
      circles.push({
        circleIndex: currentCircle,
        photosCount: photosInThisCircle,
        radius: baseRadius + currentCircle * radiusIncrement,
      });
      remainingPhotos -= photosInThisCircle;
      currentCircle++;
    }
    return circles;
  }, [circleSeed, numberOfCards]);

  // Generate random rotations
  const randomRotations = useMemo(() => {
    const random = createDeterministicRandom(rotationSeed);
    return Array.from({ length: numberOfCards }).map((_, index) => {
      const randomRotation = random() * 16 - 8;
      return { rotate: index % 2 === 0 ? randomRotation : -randomRotation };
    });
  }, [numberOfCards, rotationSeed]);

  // Calculate positions
  const photoPositions = useMemo(() => {
    const positions = [];
    let photoIndex = 0;

    for (const circle of circlesData) {
      const photosInCircle = circle.photosCount;
      const angleOffsetPerCard = 360 / photosInCircle;
      const angleOffset = 250;

      for (let i = 0; i < photosInCircle; i++) {
        if (photoIndex >= numberOfCards) break;
        const angle = ((i * angleOffsetPerCard + angleOffset) * Math.PI) / 180;
        positions.push({
          photoIndex,
          spreadX: circle.radius * Math.cos(angle),
          spreadY: circle.radius * Math.sin(angle),
        });
        photoIndex++;
      }
    }
    return positions;
  }, [circlesData, numberOfCards]);

  return (
    <motion.div
      key="spiral"
      className="relative h-full w-full flex items-center justify-center"
      style={{ transformOrigin: "center" }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {photoPositions.map((position, index) => {
        const photo = photos[index % photos.length];
        const { rotate } = randomRotations[index];

        return (
          <motion.div
            key={`spiral-photo-${index}`}
            className="absolute left-1/2 top-1/2"
            style={{ zIndex: 1 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: -20 }}
            animate={
              animationPhase === "initial"
                ? {}
                : animationPhase === "spread"
                  ? {
                      x: position.spreadX,
                      y: position.spreadY,
                      scale: 1,
                      opacity: 1,
                      rotate: 0,
                    }
                  : { x: -50, y: -50, scale: 0.4, opacity: 0, rotate }
            }
            transition={{
              type: animationPhase === "fadeOut" ? "tween" : "spring",
              stiffness: 300,
              damping: 18,
              delay: animationPhase === "spread" ? index * 0.08 : 0,
              duration: animationPhase === "fadeOut" ? 0.15 : 0.4,
              ease: animationPhase === "fadeOut" ? "circOut" : undefined,
            }}
          >
            <div
              className={cn(
                "-translate-x-1/2 -translate-y-1/2 bg-white rounded-[15px] p-[5px] inner-stroke-black-5-sm",
                isMobile ? "h-[160px] w-[130px]" : "h-[180px] w-[240px]"
              )}
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover inner-stroke-black-10-xs rounded-[11px] z-30"
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default SpiralAnimation;
