import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
} from "react";
import { Vibrant } from "node-vibrant/browser";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { isMobileDevice } from "@/lib/deviceDetection";
import BackgroundColorSelector, {
  BackgroundOption,
} from "./BackgroundColorSelector";
import Tilt from "./Tilt";
import { delay, motion } from "framer-motion";

interface SessionGridViewProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  className?: string;
}

// Configuration for the grid layout
const FRAME_RATIO = 6 / 5; // container height ÷ width (5:6)

// Row planner – produces a list of 3‑ or 2‑image rows whose total equals N
// and that **centres** any 2‑image rows.
function planRows(N: number): number[] {
  // 1. Base plan (2‑rows always at the end)
  const base: number[] = (() => {
    const threes = Math.floor(N / 3);
    const rem = N % 3;
    if (rem === 0) return Array(threes).fill(3);
    if (rem === 1) {
      return threes >= 1 ? [...Array(threes - 1).fill(3), 2, 2] : [2, 2];
    }
    return [...Array(threes).fill(3), 2]; // rem === 2
  })();

  const twoCount = base.filter((r) => r === 2).length;
  if (twoCount === 0) return base; // nothing to centre

  const total = base.length;
  const result: number[] = new Array(total);

  if (twoCount === 1) {
    // Single 2‑row → place at centre index (upper‑middle if even)
    const idx = Math.floor((total - 1) / 2);
    result[idx] = 2;
  } else if (twoCount === 2) {
    // Two 2‑rows → start at centre‑1 (upper‑middle pair)
    const start = Math.floor((total - 2) / 2);
    result[start] = 2;
    result[start + 1] = 2;
  }

  // Fill remaining slots with 3s
  for (let i = 0; i < total; i++) {
    if (result[i] === undefined) result[i] = 3;
  }
  return result;
}

interface Tile {
  top: number;
  left: number;
  width: number;
  height: number;
  cols: 2 | 3;
}

interface FillGridProps {
  photos: string[];
}

function FillGrid({ photos }: FillGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<Tile[]>();

  // Clear stale tiles whenever the photo count changes
  useLayoutEffect(() => setTiles(undefined), [photos.length]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const layout = () => {
      const W = el.clientWidth;
      const H = W * FRAME_RATIO;
      const rowsPlan = planRows(photos.length);
      const spacing = 0; // 2px spacing between images

      // Calculate total spacing in each row and adjust row height
      const rowH = H / rowsPlan.length;

      const newTiles: Tile[] = [];
      let y = 0;
      rowsPlan.forEach((cols) => {
        // Calculate tile width accounting for spacing between tiles
        const totalSpacingInRow = (cols - 1) * spacing;
        const tileW = (W - totalSpacingInRow) / cols;

        for (let c = 0; c < cols; c++) {
          newTiles.push({
            top: y,
            left: c * (tileW + spacing),
            width: tileW,
            height: rowH - spacing, // Subtract spacing from height for vertical gap
            cols: cols as 2 | 3,
          });
        }
        y += rowH;
      });
      setTiles(newTiles);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    return () => ro.disconnect();
  }, [photos.length]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-xl bg-white"
      style={{
        paddingBottom: `${FRAME_RATIO * 100}%`,
        boxShadow: "inset 0 0 0 16px white", // Creates a 16px white inset border (equivalent to p-4)
      }}
    >
      {tiles?.map((tile, i) => {
        if (i >= photos.length) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: tile.top,
              left: tile.left,
              width: tile.width,
              height: tile.height,
            }}
          >
            <div className="bg-white p-[0.8px] rounded-lg h-full w-full">
              <img
                src={photos[i]}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const SessionGridView = ({
  screenshots = [],
  webcamPhotos = [],
  taskName = "Focus Session",
  duration = 25,
  className,
}: SessionGridViewProps) => {
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

  // Combine photos based on device type
  const allPhotos = useMemo(() => {
    if (isMobile) {
      return [...webcamPhotos].filter(Boolean);
    } else {
      // For desktop, combine screenshots and webcam photos
      const combined = [];
      const maxLength = Math.max(screenshots.length, webcamPhotos.length);

      for (let i = 0; i < maxLength; i++) {
        if (screenshots[i]) combined.push(screenshots[i]);
        if (webcamPhotos[i]) combined.push(webcamPhotos[i]);
      }

      return combined.filter(Boolean);
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

  // Reference to the task badge element for color extraction and CSS variable updates
  const taskBadgeRef = useRef<HTMLDivElement>(null);

  // Function to extract colors from an image
  const extractColorsFromImage = async (imageSrc: string) => {
    try {
      const palette = await Vibrant.from(imageSrc).getPalette();

      // Create dynamic background options based on the palette
      const dynamicOptions: BackgroundOption[] = [];

      // Add gradient option using Vibrant and LightVibrant for desktop, solid color for mobile
      if (palette.Vibrant && palette.LightVibrant) {
        if (isMobile) {
          // For mobile devices, use a solid Vibrant color instead of gradient
          dynamicOptions.push({
            id: "mobileVibrant",
            name: "Vibrant",
            className: `bg-[${palette.Vibrant.hex}]`,
            style: { backgroundColor: palette.Vibrant.hex },
          });
        } else {
          // For desktop, use the gradient as before
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

        // Update task badge CSS variables with vibrant colors
        if (taskBadgeRef.current) {
          const vibrantColor = palette.Vibrant.hex;
          const lightVibrantColor = palette.LightVibrant.hex;

          // Convert hex to rgba with opacity
          const toRgba = (hex: string, opacity: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
          };

          // Set initial state colors
          taskBadgeRef.current.style.setProperty(
            "--color-1",
            "rgba(24, 24, 44, 0.96)",
          );
          taskBadgeRef.current.style.setProperty(
            "--color-2",
            "rgba(24, 24, 44, 0.96)",
          );
          taskBadgeRef.current.style.setProperty(
            "--color-3",
            toRgba(vibrantColor, 0.3),
          );
          taskBadgeRef.current.style.setProperty(
            "--color-4",
            "rgba(24, 24, 44, 0.96)",
          );
          taskBadgeRef.current.style.setProperty(
            "--color-5",
            "rgba(24, 24, 44, 0.96)",
          );

          // Set border colors
          taskBadgeRef.current.style.setProperty(
            "--border-color-1",
            toRgba(lightVibrantColor, 0.1),
          );
          taskBadgeRef.current.style.setProperty(
            "--border-color-2",
            toRgba(vibrantColor, 0.1),
          );

          // Removed hover state colors to keep only static default state
        }
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

  // Extract colors from the last photo when available
  useEffect(() => {
    if (lastPhoto) {
      extractColorsFromImage(lastPhoto);
    }
  }, [lastPhoto]);

  return (
    <Card
      className={cn(
        "w-full h-full relative overflow-hidden",
        selectedBackground?.className,
        className,
      )}
      style={selectedBackground?.style}
    >
      {/* Fixed size container for grid layout */}
      <div className="w-full h-full overflow-auto flex justify-center items-center">
        {/* Tilt component without motion wrapper */}
        <Tilt
          className="w-[55%] sm:w-[35%] md:w-[29%] mb-9"
          rotationFactor={6}
          springOptions={{ stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="p-1 bg-white rounded-xl shadow-md w-full"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 22,
              delay: 0.05,
            }}
          >
            <div className="relative">
              <FillGrid photos={allPhotos} />
            </div>
            {/* Session info displayed at the bottom of the card */}
            <div className="w-full text-center mt-1">
              <div
                ref={taskBadgeRef}
                className="task-badge text-neutral-50/90 inner-stroke-white-20-sm pointer-events-none"
                style={{
                  textShadow: "1px 1.5px 2px rgba(0,0,0,0.28)",
                  maxWidth: "100%",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  textWrap: "balance",
                }}
              >
                {taskName} • {duration} {duration === 1 ? "min" : "min"}
              </div>
            </div>
          </motion.div>
        </Tilt>
      </div>

      {/* Background color selector - only show when dynamic colors are available */}
      {hasDynamicColors && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-30">
          <BackgroundColorSelector
            options={backgroundOptions}
            selectedId={selectedBackgroundId}
            onSelect={setSelectedBackgroundId}
            className="p-2 rounded-full bg-black/20 backdrop-blur-sm"
          />
        </div>
      )}
    </Card>
  );
};

export default SessionGridView;
