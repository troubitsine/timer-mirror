/**
 * CardStack - Reusable shuffleable photo stack with lift/peel/back animations
 * Extracted from ShareSessionMontage for shared use in SessionMontage pile phase
 */
import React, { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

type CardState = {
  id: number;
  src: string;
  pos: number;
  z: number;
  rot: number;
};

export interface CardStackProps {
  /** Array of photo URLs */
  photos: string[];
  /** Number of cards to display (max) */
  numberOfCards: number;
  /** Whether on mobile device (affects card aspect ratio) */
  isMobile?: boolean;
  /** Aspect ratio for sizing calculations */
  aspectRatio?: "16:9" | "1:1" | "9:16";
  /** Scale factor for the stack container */
  scale?: number;
  /** Additional className for the container */
  className?: string;
  /** Callback when shuffle animation completes */
  onShuffle?: () => void;
}

export interface CardStackRef {
  /** Rebuild the card stack (reset to initial state) */
  reset: () => void;
  /** Trigger a shuffle animation */
  shuffle: () => Promise<void>;
}

// Animation config
const H_X_STEP = 4; // horizontal distance between stacked cards

const CardStack = forwardRef<CardStackRef, CardStackProps>(
  (
    {
      photos,
      numberOfCards,
      isMobile = false,
      aspectRatio = "16:9",
      scale = 1,
      className,
      onShuffle,
    },
    ref
  ) => {
    // Card dimensions based on aspect ratio
    const widthPercentage = { "16:9": 0.45, "1:1": 0.7, "9:16": 0.75 }[aspectRatio];
    const CARD_W_PERCENT = Math.round(widthPercentage * 100);
    const CARD_AR = isMobile ? "4 / 5" : "4 / 3";

    // Calculate the base X position to center the stack horizontally
    const HR_BASE_X = -((numberOfCards - 1) * H_X_STEP) / 2;

    const randRot = useCallback(() => (Math.random() - 0.5) * 8, []);

    const buildCards = useCallback(
      (): CardState[] =>
        Array.from({ length: numberOfCards }, (_, i) => ({
          id: i + 1,
          src: photos[i % photos.length],
          pos: i,
          z: numberOfCards - i,
          rot: randRot(),
        })),
      [photos, numberOfCards, randRot]
    );

    const [cards, setCards] = useState<CardState[]>(() => buildCards());
    const [movingId, setMovingId] = useState<number | null>(null);
    const controls = useAnimation();

    // Rebuild cards when photos or numberOfCards changes
    useEffect(() => {
      setCards(buildCards());
    }, [buildCards]);

    // --- Pose helpers ---
    const basePose = useCallback(
      (c: CardState) => ({
        x: HR_BASE_X + c.pos * H_X_STEP,
        y: 0,
        rotate: c.rot,
        zIndex: c.z,
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

    // --- Shuffle cycle ---
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
      onShuffle?.();
    }, [backPose, cards, controls, liftPose, peelPose, randRot, onShuffle]);

    // Reset function
    const reset = useCallback(() => {
      setCards(buildCards());
      setMovingId(null);
    }, [buildCards]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({ reset, shuffle }), [reset, shuffle]);

    if (numberOfCards === 0) return null;

    return (
      <div
        className={cn("relative h-full w-full flex items-center justify-center", className)}
        style={
          scale !== 1
            ? {
                transform: `scale(${scale})`,
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
          {cards.map((card) => (
            <motion.div
              key={`photo-${card.id}`}
              className="absolute"
              style={{
                aspectRatio: CARD_AR,
                left: 0,
                top: 12,
                bottom: 0,
                right: 0,
                margin: "auto",
              }}
              initial={{ ...basePose(card), width: `${CARD_W_PERCENT}%` }}
              animate={
                card.id === movingId
                  ? controls
                  : { ...basePose(card), width: `${CARD_W_PERCENT}%` }
              }
              transition={{
                width: { type: "spring", stiffness: 300, damping: 28 },
              }}
            >
              <div
                className={cn(
                  "overflow-hidden w-full h-full bg-white inner-stroke-black-5-sm",
                  aspectRatio === "9:16"
                    ? "p-[3px] rounded-[10px]"
                    : "p-[5px] rounded-[15px]"
                )}
              >
                <img
                  src={card.src}
                  alt={`Photo ${card.id}`}
                  loading="eager"
                  decoding="async"
                  className={cn(
                    "w-full h-full object-cover z-30 shadow-[0_1px_2px_rgba(0,0,0,0.14),_0_8px_8px_rgba(0,0,0,0.04)]",
                    aspectRatio === "9:16" ? "rounded-[7px]" : "rounded-[11px]"
                  )}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }
);

CardStack.displayName = "CardStack";

export default CardStack;
