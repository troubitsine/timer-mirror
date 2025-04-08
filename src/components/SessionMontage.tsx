import React, { useState, useEffect, useMemo } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Timer, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isMobileDevice } from "@/lib/deviceDetection";
import BackgroundColorSelector, {
  BackgroundOption,
} from "./BackgroundColorSelector";
import { cn } from "@/lib/utils";
import { Vibrant } from "node-vibrant/browser";

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

  // Plain white background for when no dynamic colors are available
  const plainWhiteBackground: BackgroundOption = {
    id: "white",
    name: "White",
    className: "bg-white",
  };

  // State for dynamic background options
  const [backgroundOptions, setBackgroundOptions] = useState<
    BackgroundOption[]
  >([plainWhiteBackground]);

  // Track if dynamic colors were successfully extracted
  const [hasDynamicColors, setHasDynamicColors] = useState(false);

  // State for selected background
  const [selectedBackgroundId, setSelectedBackgroundId] = useState("white");

  // Get the selected background option
  const selectedBackground = backgroundOptions.find(
    (option) => option.id === selectedBackgroundId,
  );

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

  // For mobile, we only use webcam photos
  const allPhotos = useMemo(() => {
    if (isMobile) {
      return [...webcamPhotos].filter(Boolean);
    } else {
      return interleaveArrays(screenshots, webcamPhotos).filter(Boolean);
    }
  }, [screenshots, webcamPhotos, isMobile]);

  // Get the last photo for color extraction
  const lastPhoto = useMemo(() => {
    if (isMobile) {
      // On mobile, use the last webcam photo
      return webcamPhotos.length > 0
        ? webcamPhotos[webcamPhotos.length - 1]
        : null;
    } else {
      // On desktop, prefer the last screenshot, fallback to webcam photo
      return screenshots.length > 0
        ? screenshots[screenshots.length - 1]
        : webcamPhotos.length > 0
          ? webcamPhotos[webcamPhotos.length - 1]
          : null;
    }
  }, [screenshots, webcamPhotos, isMobile]);

  // Function to extract colors from an image
  const extractColorsFromImage = async (imageSrc: string) => {
    try {
      const palette = await Vibrant.from(imageSrc).getPalette();

      // Create dynamic background options based on the palette
      const dynamicOptions: BackgroundOption[] = [];

      // Add gradient option using Vibrant and LightVibrant
      if (palette.Vibrant && palette.LightVibrant) {
        dynamicOptions.push({
          id: "dynamicGradient",
          name: "Dynamic Gradient",
          style: {
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1111 1111' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.4' numOctaves='3' stitchTiles='stitch'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"),
            radial-gradient(circle at 0% 99%, ${palette.Vibrant.hex} 0%, transparent 67%),
            radial-gradient(circle at 46% 94%, ${palette.LightVibrant.hex} 0%, transparent 81%),
            radial-gradient(circle at 93% 95%, ${palette.Vibrant.hex} 0%, transparent 66%),
            radial-gradient(circle at 89% 8%, ${palette.LightVibrant.hex} 0%, transparent 150%)`,
            backgroundColor: palette.Vibrant.hex,
            backgroundBlendMode: "overlay, normal, normal, normal, normal",
          },
        });
      }

      // Add solid color options
      if (palette.LightVibrant) {
        dynamicOptions.push({
          id: "lightVibrant",
          name: "Light Vibrant",
          className: `bg-[${palette.LightVibrant.hex}]`,
          style: { backgroundColor: palette.LightVibrant.hex },
        });
      }

      if (palette.Muted) {
        dynamicOptions.push({
          id: "muted",
          name: "Muted",
          className: `bg-[${palette.Muted.hex}]`,
          style: { backgroundColor: palette.Muted.hex },
        });
      }

      if (palette.LightMuted) {
        dynamicOptions.push({
          id: "lightMuted",
          name: "Light Muted",
          className: `bg-[${palette.LightMuted.hex}]`,
          style: { backgroundColor: palette.LightMuted.hex },
        });
      }

      // If we have dynamic options, use them; otherwise, keep the plain white background
      if (dynamicOptions.length > 0) {
        setBackgroundOptions(dynamicOptions);
        // Set the first dynamic option as selected
        setSelectedBackgroundId(dynamicOptions[0].id);
        // Indicate that we have dynamic colors
        setHasDynamicColors(true);
      } else {
        // Reset to plain white background if no dynamic colors could be extracted
        setBackgroundOptions([plainWhiteBackground]);
        setSelectedBackgroundId("white");
        setHasDynamicColors(false);
      }
    } catch (error) {
      console.error("Error extracting colors from image:", error);
      // Keep using default options if there's an error
    }
  };

  // Animation states
  const [animationPhase, setAnimationPhase] = useState<
    "initial" | "spread" | "pile"
  >("initial");
  const [isHovering, setIsHovering] = useState(false);
  const [badgeVisible, setBadgeVisible] = useState(false);

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

  // Extract colors from the last photo when available
  useEffect(() => {
    if (lastPhoto) {
      extractColorsFromImage(lastPhoto);
    }
  }, [lastPhoto]);

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
        "w-full lg:w-[65vw] min-w-[300px] max-w-[1800px] mx-auto space-y-4 h-[60vh] sm:aspect-video relative",
        selectedBackground?.className,
      )}
      style={selectedBackground?.style}
    >
      {/* Session info displayed at the top of the card - absolutely positioned */}
      <motion.div
        className="absolute top-3 w-full text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={badgeVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <div className="inline-block bg-gray-900/75 backdrop-blur-sm text-white/90 px-4 py-2 rounded-lg text-sm font-medium shadow-md">
          {taskName} • {duration} {duration === 1 ? "minute" : "minutes"}
        </div>
      </motion.div>

      <div className="flex flex-col h-full items-center justify-center">
        <div className="h-[300px] w-full max-w-[500px] flex items-center justify-center">
          {/* Spiral animation */}
          {numberOfCards > 0 && (
            <div
              className={`relative h-full w-full flex items-center justify-center ${
                animationPhase === "pile" ? "cursor-pointer" : ""
              }`}
              onMouseEnter={() =>
                animationPhase === "pile" && setIsHovering(true)
              }
              onMouseLeave={() => setIsHovering(false)}
              onClick={() => animationPhase === "pile" && startAnimation()}
            >
              {photoPositions.map((position, index) => {
                // Use the actual photo from allPhotos
                const photo = allPhotos[index % allPhotos.length];

                // Get random rotation for pile effect
                const {
                  rotate,
                  x: pileOffsetX,
                  y: pileOffsetY,
                } = randomRotations[index];

                // Calculate hover reveal position (slightly outward from center)
                const hoverRevealFactor = 0.4; // How much to reveal (0.3 = 30% of the full spread)
                const hoverX =
                  position.spreadX * hoverRevealFactor + pileOffsetX;
                const hoverY =
                  position.spreadY * hoverRevealFactor + pileOffsetY;

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
                              x: position.spreadX,
                              y: position.spreadY,
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
                      duration: 0.5,
                    }}
                  >
                    <div className="h-[140px] w-[200px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-[14px] p-1 ring-[0.5px] ring-black/10 shadow-[rgba(21,_22,_31,_0.01)_0px_0.6px_1.4px_-0.5px,_rgba(21,_22,_31,_0.01)_0px_2.5px_5.5px_-1.1px,_rgba(21,_22,_31,_0.02)_0px_11px_24.2px_-1.75px]">
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

        {/* Background color selector - only show when dynamic colors are available */}
        {hasDynamicColors && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <BackgroundColorSelector
              options={backgroundOptions}
              selectedId={selectedBackgroundId}
              onSelect={setSelectedBackgroundId}
              className="p-2 rounded-full bg-black/20 backdrop-blur-sm"
            />
          </div>
        )}

        {/* Replay button */}
        <motion.div
          className="absolute bottom-3 right-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          onMouseEnter={() => animationPhase === "pile" && setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <Button
            size="sm"
            variant="secondary"
            onClick={startAnimation}
            className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm px-[11px] py-[6px]"
          >
            <RotateCw className="h-4 w-4" />
            Replay
          </Button>
        </motion.div>
      </div>
    </Card>
  );
};

export default SessionMontage;
