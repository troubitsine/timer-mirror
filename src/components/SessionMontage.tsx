import React, { useState, useEffect, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isMobileDevice } from "@/lib/deviceDetection";

interface SessionMontageProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  onSave?: () => void;
}

const SessionMontage = ({
  screenshots = [],
  webcamPhotos = [],
  taskName = "Focus Session",
  duration = 25,
  onSave = () => {},
}: SessionMontageProps) => {
  const navigate = useNavigate();
  const isMobile = isMobileDevice();

  // For mobile, we only use webcam photos
  const allPhotos = isMobile
    ? [...webcamPhotos].filter(Boolean)
    : [...screenshots, ...webcamPhotos].filter(Boolean);

  // Animation states
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "spread" | "pile"
  >("initial");
  const [isHovering, setIsHovering] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);

  // Calculate number of cards based on available photos
  const numberOfCards = Math.min(allPhotos.length, 12); // Limit to 12 cards max
  const radius = 180; // Slightly smaller radius than the example
  const angleOffsetPerCard = 360 / numberOfCards;

  // Generate random rotations for the pile effect
  const randomRotations = useMemo(
    () =>
      Array.from({ length: numberOfCards }).map(() => ({
        rotate: Math.random() * 40 - 20, // Random rotation between -20 and 20 degrees
        x: Math.random() * 20 - 10, // Small random x offset
        y: Math.random() * 20 - 10, // Small random y offset
      })),
    [numberOfCards],
  );

  // Start the animation sequence
  const startAnimation = () => {
    // Reset to initial state for photos only
    setAnimationPhase("initial");
    setIsHovering(false);

    // Show badge first if not already visible
    if (!badgeVisible) {
      setBadgeVisible(true);
    }

    // Use setTimeout to ensure state updates before starting spread
    // Add a delay to allow badge to appear first
    setTimeout(() => {
      setAnimationPhase("spread");

      // After all cards have spread out, trigger the pile animation
      const spreadDuration = numberOfCards * 100 + 1000; // Base on the stagger delay
      setTimeout(() => {
        setAnimationPhase("pile");
      }, spreadDuration);
    }, 800); // Increased delay to allow badge to appear first
  };

  // Auto-start animation on first load
  useEffect(() => {
    startAnimation();

    // Cleanup function
    return () => {};
  }, []);

  return (
    <Card className="w-full min-h-[400px] bg-background p-6 relative">
      <div className="flex flex-col h-full items-center justify-center gap-8">
        <div className="relative h-[300px] w-full max-w-[500px]">
          {/* Session info displayed at the top of the card */}
          <motion.div
            className="relative flex justify-center w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={
              badgeVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }
            }
            transition={{ duration: 0.4 }}
          >
            <div className="bg-gray-900/75 backdrop-blur-sm text-white/90 px-4 py-2 rounded-lg text-sm font-medium shadow-md">
              {taskName} • {duration} {duration === 1 ? "minute" : "minutes"}
            </div>
          </motion.div>

          {/* Circular animation */}
          {numberOfCards > 0 && (
            <div
              className={`relative h-full w-full ${animationPhase === "pile" ? "cursor-pointer" : ""}`}
              onMouseEnter={() =>
                animationPhase === "pile" && setIsHovering(true)
              }
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => animationPhase === "pile" && startAnimation()}
            >
              {Array.from({ length: numberOfCards }).map((_, index) => {
                // Use the actual photo from allPhotos
                const photo = allPhotos[index % allPhotos.length];

                // Calculate the angle for this card (in radians)
                const angle = (index * angleOffsetPerCard * Math.PI) / 180;

                // Calculate the spread position using trigonometry
                const spreadX = radius * Math.cos(angle);
                const spreadY = radius * Math.sin(angle);

                // Get random rotation for pile effect
                const {
                  rotate,
                  x: pileOffsetX,
                  y: pileOffsetY,
                } = randomRotations[index];

                // Calculate hover reveal position (slightly outward from center)
                const hoverRevealFactor = 0.3; // How much to reveal (0.3 = 30% of the full spread)
                const hoverX = spreadX * hoverRevealFactor + pileOffsetX;
                const hoverY = spreadY * hoverRevealFactor + pileOffsetY;

                return (
                  <motion.div
                    key={index}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      zIndex:
                        animationPhase === "pile" ? numberOfCards - index : 1,
                    }}
                    initial={{
                      x: 0,
                      y: 0,
                      scale: 0,
                      opacity: 0,
                      rotate: -30,
                      zIndex: 1,
                    }}
                    animate={
                      animationPhase === "initial"
                        ? {}
                        : animationPhase === "spread"
                          ? {
                              x: spreadX,
                              y: spreadY,
                              scale: 1,
                              opacity: 1,
                              rotate: 0,
                              zIndex: 1,
                            }
                          : isHovering
                            ? {
                                // hover reveal effect
                                x: hoverX,
                                y: hoverY,
                                scale: 1,
                                opacity: 1,
                                rotate: rotate,
                                zIndex: numberOfCards - index,
                              }
                            : {
                                // pile phase
                                x: pileOffsetX,
                                y: pileOffsetY,
                                scale: 1,
                                opacity: 1,
                                rotate: rotate,
                                zIndex: numberOfCards - index,
                              }
                    }
                    transition={{
                      type: "spring",
                      stiffness: animationPhase === "spread" ? 260 : 300,
                      damping: animationPhase === "spread" ? 20 : 25,
                      delay: animationPhase === "spread" ? index * 0.1 : 0, // stagger only on spread
                      duration: 0.4,
                    }}
                  >
                    <div className="h-[120px] w-[180px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-[14px] p-1 ring-[0.5px] ring-black/5 shadow-[rgba(21,_22,_31,_0.015)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.015)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.025)_0px_11px_24.2px_-1.75px]">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover rounded-[12px] ring-[0.5px] ring-black/5"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 items-center">
          <Button
            variant="default"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Timer className="h-4 w-4" />
            Start New Timer
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SessionMontage;
