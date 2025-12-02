/**
 * UnifiedPhotoAnimation - Seamless spiral-to-pile animation with shuffle interaction
 * Handles all animation phases: spread → collapse → pile
 */
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface UnifiedPhotoAnimationProps {
  photos: string[];
  numberOfCards: number;
  isMobile: boolean;
  animationPhase: "initial" | "spread" | "collapse" | "pile" | "fadeOut";
  circleSeed: number;
  rotationSeed?: number; // Kept for API compatibility, unused in current implementation
  onShuffle?: () => void;
}

type CardState = {
  id: number;
  src: string;
  pos: number;
  z: number;
  rot: number;
  spiralX: number;
  spiralY: number;
};

// Animation config
const H_X_STEP = 4; // horizontal distance between stacked cards

const createDeterministicRandom = (seed: number) => {
  let currentSeed = seed;
  return () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };
};

const UnifiedPhotoAnimation = ({
  photos,
  numberOfCards,
  isMobile,
  animationPhase,
  circleSeed,
  rotationSeed: _rotationSeed,
  onShuffle,
}: UnifiedPhotoAnimationProps) => {
  const baseRadius = 100;
  const radiusIncrement = 8;

  // Calculate spiral positions (from SpiralAnimation)
  const spiralPositions = useMemo(() => {
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

    const positions = [];
    let photoIndex = 0;

    for (const circle of circles) {
      const photosInCircle = circle.photosCount;
      const angleOffsetPerCard = 360 / photosInCircle;
      const angleOffset = 250;

      for (let i = 0; i < photosInCircle; i++) {
        if (photoIndex >= numberOfCards) break;
        const angle = ((i * angleOffsetPerCard + angleOffset) * Math.PI) / 180;
        positions.push({
          x: circle.radius * Math.cos(angle),
          y: circle.radius * Math.sin(angle),
        });
        photoIndex++;
      }
    }
    return positions;
  }, [circleSeed, numberOfCards]);


  // Calculate pile base X to center the stack horizontally
  const HR_BASE_X = -((numberOfCards - 1) * H_X_STEP) / 2;

  const randRot = useCallback(() => (Math.random() - 0.5) * 8, []);

  // Build initial card states with both spiral and pile info
  const buildCards = useCallback(
    (): CardState[] =>
      Array.from({ length: numberOfCards }, (_, i) => ({
        id: i + 1,
        src: photos[i % photos.length],
        pos: i,
        z: numberOfCards - i,
        rot: randRot(),
        spiralX: spiralPositions[i]?.x || 0,
        spiralY: spiralPositions[i]?.y || 0,
      })),
    [photos, numberOfCards, randRot, spiralPositions]
  );

  const [cards, setCards] = useState<CardState[]>(() => buildCards());
  const [movingId, setMovingId] = useState<number | null>(null);
  const controls = useAnimation();

  // Rebuild cards when dependencies change
  useEffect(() => {
    setCards(buildCards());
  }, [buildCards]);

  // --- Pose helpers for pile phase ---
  const basePose = useCallback(
    (c: CardState) => ({
      x: HR_BASE_X + c.pos * H_X_STEP,
      y: 0,
      rotate: c.rot,
      zIndex: c.z,
      scale: 1,
      opacity: 1,
    }),
    [HR_BASE_X]
  );

  const liftPose = useCallback(
    (c: CardState) => ({
      ...basePose(c),
      y: -24,
      rotate: c.rot + 6,
      zIndex: 200,
      scale: 0.96,
      opacity: 1,
      transition: { type: "spring", stiffness: 320, damping: 32 },
    }),
    [basePose]
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
    [basePose]
  );

  const backPose = useCallback(
    (len: number) => ({
      x: HR_BASE_X + (len - 1) * H_X_STEP,
      y: -10,
      rotate: 0,
      scale: 1,
      opacity: 1,
      zIndex: 1,
      transition: { type: "spring", stiffness: 300, damping: 22 },
    }),
    [HR_BASE_X]
  );

  // --- Shuffle logic ---
  const shuffle = useCallback(async () => {
    if (animationPhase !== "pile" && animationPhase !== "fadeOut") return;
    
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
    onShuffle?.();
  }, [animationPhase, backPose, cards, controls, liftPose, peelPose, randRot, onShuffle]);

  // Calculate animation properties based on phase
  const getAnimateProps = (card: CardState) => {
    const base = basePose(card);

    switch (animationPhase) {
      case "initial":
        return { x: 0, y: 0, scale: 0, opacity: 0, rotate: -20 };

      case "spread":
        return {
          x: card.spiralX,
          y: card.spiralY,
          scale: 1,
          opacity: 1,
          rotate: 0,
          zIndex: 1,
        };

      case "collapse":
        return {
          x: base.x,
          y: base.y,
          scale: 1,
          opacity: 1,
          rotate: card.rot,
          zIndex: card.z,
        };

      case "pile":
        return card.id === movingId ? undefined : base;

      case "fadeOut":
        return {
          x: base.x,
          y: base.y,
          scale: 0.4,
          opacity: 0,
          rotate: card.rot,
          zIndex: card.z,
        };

      default:
        return base;
    }
  };

  // Calculate transition properties based on phase
  const getTransition = (index: number) => {
    switch (animationPhase) {
      case "spread":
        return {
          type: "spring",
          stiffness: 300,
          damping: 18,
          delay: index * 0.08,
        };

      case "collapse":
        // Reverse stagger - back cards move first for depth effect
        return {
          type: "spring",
          stiffness: 280,
          damping: 20,
          delay: (numberOfCards - index - 1) * 0.04,
        };

      case "pile":
        return {
          type: "spring",
          stiffness: 300,
          damping: 22,
        };

      case "fadeOut":
        return {
          type: "tween",
          duration: 0.15,
          ease: "circOut",
        };

      default:
        return {
          type: "spring",
          stiffness: 300,
          damping: 22,
        };
    }
  };

  const widthPercentage = 0.45;
  const CARD_W_PERCENT = Math.round(widthPercentage * 100);
  const CARD_AR = isMobile ? "4 / 5" : "4 / 3";

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <motion.div
        className="relative h-full w-full flex items-center justify-center"
        whileHover={animationPhase === "pile" ? { scale: 1.04 } : undefined}
        whileTap={animationPhase === "pile" ? { scale: 0.98 } : undefined}
        onTap={animationPhase === "pile" ? shuffle : undefined}
        style={{ pointerEvents: animationPhase === "pile" ? "auto" : "none" }}
      >
        {cards.map((card, index) => {
          const animateProps = getAnimateProps(card);
          const shouldUseControls = card.id === movingId && animationPhase === "pile";

          return (
            <motion.div
              key={`photo-${card.id}`}
              className="absolute"
              style={
                animationPhase === "pile" || animationPhase === "collapse"
                  ? {
                      width: `${CARD_W_PERCENT}%`,
                      aspectRatio: CARD_AR,
                      left: 0,
                      top: 12,
                      bottom: 0,
                      right: 0,
                      margin: "auto",
                    }
                  : {
                      left: "50%",
                      top: "50%",
                      zIndex: animateProps?.zIndex || 1,
                    }
              }
              initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: -20 }}
              animate={shouldUseControls ? controls : animateProps}
              transition={getTransition(index)}
            >
              <div
                className={cn(
                  "bg-white inner-stroke-black-5-sm",
                  animationPhase === "pile" || animationPhase === "collapse"
                    ? "overflow-hidden w-full h-full p-[5px] rounded-[15px]"
                    : cn(
                        "-translate-x-1/2 -translate-y-1/2 rounded-[15px] p-[5px]",
                        isMobile ? "h-[160px] w-[130px]" : "h-[180px] w-[240px]"
                      )
                )}
              >
                <img
                  src={card.src}
                  alt={`Photo ${card.id}`}
                  loading="eager"
                  decoding="async"
                  className={cn(
                    "w-full h-full object-cover z-30",
                    animationPhase === "pile" || animationPhase === "collapse"
                      ? "rounded-[11px] shadow-[0_1px_2px_rgba(0,0,0,0.14),_0_8px_8px_rgba(0,0,0,0.04)]"
                      : "inner-stroke-black-10-xs rounded-[11px]"
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default UnifiedPhotoAnimation;
