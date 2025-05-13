import React, { useRef, useLayoutEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { isMobileDevice } from "@/lib/deviceDetection";
import BackgroundColorSelector from "./BackgroundColorSelector";
import Tilt from "./Tilt";
import { motion } from "framer-motion";
import { useDynamicBackground } from "@/lib/useDynamicBackground";

interface SessionGridViewProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  className?: string;
  initialSelectedBackgroundId?: string;
  onBackgroundSelect?: (id: string) => void;
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
  initialSelectedBackgroundId,
  onBackgroundSelect,
}: SessionGridViewProps) => {
  const isMobile = isMobileDevice();

  // Get the last photo for color extraction

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

  // No need for extractColorsFromImage effect - handled by the hook

  return (
    <Card
      className={cn(
        "w-full h-full relative overflow-hidden border-0",
        selectedBackground?.className,
        className,
      )}
      style={selectedBackground?.style}
    >
      {/* Fixed size container for grid layout */}
      <div className="w-full h-full overflow-auto flex justify-center items-center">
        {/* Tilt component without motion wrapper */}
        <Tilt
          className="w-[55%] sm:w-[35%] md:w-[29%] mb-11"
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
        <div className="absolute bottom-3.5 left-4 flex justify-center z-30">
          <BackgroundColorSelector
            options={backgroundOptions}
            selectedId={selectedBackgroundId}
            onSelect={setSelectedBackgroundId}
            className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
          />
        </div>
      )}
    </Card>
  );
};

export default SessionGridView;
