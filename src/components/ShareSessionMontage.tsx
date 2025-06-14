import React, { useState, useEffect, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
}

const ShareSessionMontage = ({
  screenshots = [],
  webcamPhotos = [],
  taskName = "Focus Session",
  duration = 25,
  onSave = () => {},
  initialSelectedBackgroundId,
  onBackgroundSelect,
  hideControls = false,
  selectedBackgroundId: externalSelectedBackgroundId,
  setSelectedBackgroundId: externalSetSelectedBackgroundId,
}: ShareSessionMontageProps) => {
  const navigate = useNavigate();
  const isMobile = isMobileDevice();

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

  // Use external selectedBackgroundId and setSelectedBackgroundId if provided
  useEffect(() => {
    if (
      externalSelectedBackgroundId &&
      externalSelectedBackgroundId !== selectedBackgroundId
    ) {
      setSelectedBackgroundId(externalSelectedBackgroundId);
    }
  }, [externalSelectedBackgroundId]);

  // Animation states
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "spread" | "pile" | "fadeOut"
  >("initial");
  const [isHovering, setIsHovering] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);

  // State to track the order of photos for the shuffle effect
  const [photoOrder, setPhotoOrder] = useState<number[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  // Calculate number of cards based on available photos
  const numberOfCards = Math.min(allPhotos.length, 12); // Limit to 12 cards max

  // Function to get random number of photos per circle (between 4 and 6)
  const getRandomPhotosPerCircle = () => {
    return Math.floor(Math.random() * 3) + 4; // Generates a random number between 4 and 6
  };

  // Calculate spiral parameters
  const baseRadius = 100; // Starting radius for the innermost circle
  const radiusIncrement = 8; // How much to increase radius for each circle

  // Create circles data structure with random photos per circle
  const circlesData = useMemo(() => {
    const circles = [];
    let remainingPhotos = numberOfCards;
    let currentCircle = 0;

    while (remainingPhotos > 0) {
      // Get random number of photos for this circle (between 4-6)
      // But don't exceed remaining photos
      const photosInThisCircle = Math.min(
        getRandomPhotosPerCircle(),
        remainingPhotos,
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
  }, [numberOfCards]);

  // Generate random rotations for the pile effect
  const randomRotations = useMemo(
    () =>
      Array.from({ length: numberOfCards }).map((_, index) => {
        const randomRotation = Math.random() * 16 - 8; // Random rotation between -8 and 8 degrees
        const rotate = index % 2 === 0 ? randomRotation : -randomRotation; // Alternate sign
        return {
          rotate: rotate,
          x: Math.random() * 20 - 10, // Small random x offset
          y: Math.random() * 20 - 10, // Small random y offset
        };
      }),
    [numberOfCards],
  );

  // Start the animation sequence
  const startAnimation = () => {
    // First fade out the current pile to the center
    if (animationPhase === "pile") {
      // Create a temporary animation phase for the fade out
      const tempPhase = "fadeOut";
      setAnimationPhase(tempPhase as any);

      // Wait for fade out animation to complete - further reduced time for even faster transition
      setTimeout(() => {
        // Then reset to initial state
        setAnimationPhase("initial");
        setIsHovering(false);

        // Show badge if not already visible
        if (!badgeVisible) {
          setBadgeVisible(true);
        }

        // Start the spread animation after a very short delay
        setTimeout(() => {
          setAnimationPhase("spread");

          // After all cards have spread out, trigger the pile animation
          const spreadDuration = numberOfCards * 80 + 800; // Reduced base time and stagger delay
          setTimeout(() => {
            setAnimationPhase("pile");
          }, spreadDuration);
        }, 300); // Further reduced delay for snappier transition
      }, 200); // Further reduced time for fade out animation
    } else {
      // If not already in pile phase, just start the normal animation sequence
      setAnimationPhase("initial");
      setIsHovering(false);

      // Show badge if not already visible
      if (!badgeVisible) {
        setBadgeVisible(true);
      }

      // Start the spread animation after a shorter delay
      setTimeout(() => {
        setAnimationPhase("spread");

        // After all cards have spread out, trigger the pile animation
        const spreadDuration = numberOfCards * 80 + 800; // Reduced base time and stagger delay
        setTimeout(() => {
          setAnimationPhase("pile");
        }, spreadDuration);
      }, 500); // Reduced delay to allow badge to appear first but be snappier
    }
  };

  // Auto-start animation on first load
  useEffect(() => {
    startAnimation();

    // Initialize photo order
    setPhotoOrder(Array.from({ length: numberOfCards }, (_, i) => i));
  }, [numberOfCards]);

  // Cleanup function
  useEffect(() => {
    return () => {};
  }, [numberOfCards]);

  // Calculate position data for each photo
  const photoPositions = useMemo(() => {
    const positions = [];
    let photoIndex = 0;

    // For each circle
    for (const circle of circlesData) {
      const photosInCircle = circle.photosCount;
      const angleOffsetPerCard = 360 / photosInCircle;
      const angleOffset = 250; // Offset in degrees to start from top-left

      // For each photo in this circle
      for (let i = 0; i < photosInCircle; i++) {
        if (photoIndex >= numberOfCards) break;

        // Calculate the angle for this card (in radians)
        const angle = ((i * angleOffsetPerCard + angleOffset) * Math.PI) / 180;

        // Calculate the spread position using trigonometry
        const spreadX = circle.radius * Math.cos(angle);
        const spreadY = circle.radius * Math.sin(angle);

        positions.push({
          photoIndex,
          angle,
          spreadX,
          spreadY,
          circleIndex: circle.circleIndex,
        });

        photoIndex++;
      }
    }

    return positions;
  }, [circlesData, numberOfCards]);

  return (
    <Card
      className={cn(
        "w-full h-full relative border-0",
        selectedBackground?.className,
      )}
      style={selectedBackground?.style}
    >
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
          {/* Spiral animation */}
          {numberOfCards > 0 && (
            <motion.div
              className={`relative h-full w-full flex items-center justify-center ${
                animationPhase === "pile" ? "cursor-pointer" : ""
              }`}
              style={{ transformOrigin: "center" }}
              whileHover={
                animationPhase === "pile" && !isShuffling ? { scale: 1.15 } : {}
              }
              onMouseEnter={() =>
                animationPhase === "pile" && setIsHovering(true)
              }
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => {
                if (animationPhase === "pile" && !isShuffling) {
                  // Shuffle the cards - move the top card to the bottom
                  setIsShuffling(true);
                  setTimeout(() => {
                    setPhotoOrder((prev) => {
                      const newOrder = [...prev];
                      const topCard = newOrder.shift();
                      if (topCard !== undefined) newOrder.push(topCard);
                      return newOrder;
                    });
                    setIsShuffling(false);
                  }, 500); // Wait for animation to complete
                }
              }}
            >
              {photoPositions.map((position, index) => {
                // Get the actual index from the photoOrder array to determine which photo to show
                const orderIndex =
                  photoOrder[index] !== undefined ? photoOrder[index] : index;

                // Use the actual photo from allPhotos
                const photo = allPhotos[orderIndex % allPhotos.length];

                // Get random rotation for pile effect
                const {
                  rotate,
                  x: pileOffsetX,
                  y: pileOffsetY,
                } = randomRotations[index];

                // Determine if this is the top card being shuffled
                const isTopCard = index === 0 && isShuffling;

                return (
                  <motion.div
                    key={`photo-${orderIndex}`}
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
                      rotate: -20,
                      zIndex: 1,
                    }}
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
                              zIndex: 1,
                            }
                          : animationPhase === "fadeOut"
                            ? {
                                // Fade out to center animation - faster and more dramatic
                                x: -50,
                                y: -50,
                                scale: 0.4, // Smaller scale for more dramatic effect
                                opacity: 0,
                                rotate: 0,
                                zIndex: numberOfCards - index,
                              }
                            : isTopCard
                              ? {
                                  // Top card being shuffled animation - moves down faster
                                  x: -35,
                                  y: 60, // Increased distance for more dramatic effect
                                  scale: 0.5, // Smaller scale for more dramatic effect
                                  opacity: 0,
                                  rotate: rotate * 1.2, // More rotation for more dramatic effect
                                  zIndex: numberOfCards + 1,
                                }
                              : index === 0 && !isShuffling
                                ? {
                                    // New top card - scale up by 8%
                                    x: 0, // Center horizontally
                                    y: 0, // Center vertically
                                    scale: 1.06, // Scale up by 8% for more emphasis
                                    opacity: 1,
                                    rotate: rotate,
                                    zIndex: numberOfCards,
                                  }
                                : {
                                    // pile phase for other cards
                                    x: 0, // Center horizontally
                                    y: 0, // Center vertically
                                    scale: 1,
                                    opacity: 1,
                                    rotate: rotate,
                                    zIndex: numberOfCards - index,
                                  }
                    }
                    // Removed individual card hover effect since we're scaling the entire pile
                    transition={{
                      type: animationPhase === "fadeOut" ? "tween" : "spring",
                      stiffness: animationPhase === "spread" ? 300 : 350, // Increased stiffness for snappier spring
                      damping: animationPhase === "spread" ? 18 : 22, // Reduced damping for more bounce
                      delay: animationPhase === "spread" ? index * 0.08 : 0, // Reduced stagger delay
                      duration: animationPhase === "fadeOut" ? 0.15 : 0.4, // Even faster fadeOut animation
                      ease:
                        animationPhase === "fadeOut" ? "circOut" : undefined, // Changed to circOut for even snappier feel
                    }}
                  >
                    <div
                      className={cn(
                        "-translate-x-1/2 -translate-y-1/2 bg-white rounded-[15px] p-[5px] inner-stroke-black-5-sm",
                        isMobile
                          ? "h-[160px] w-[130px]"
                          : "h-[180px] w-[240px]",
                      )}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        loading="lazy"
                        className="
    w-full h-full object-cover rounded-[11px] z-30
    shadow-[0_2px_2px_rgba(0,0,0,0.12),_0_8px_8px_rgba(0,0,0,0.012)]"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
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
      </div>
    </Card>
  );
};

export default ShareSessionMontage;
