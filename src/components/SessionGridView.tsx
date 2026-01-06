// SessionGridView.tsx
// Session grid recap view; renders photo grid within the shared session frame.
import React, { useRef, useLayoutEffect, useState } from "react";
import Tilt from "./Tilt";
import { motion } from "framer-motion";
import { useSessionMedia } from "@/lib/useSessionMedia";
import SessionFrame from "./SessionFrame";
import { useTaskBadgeAccentColor, useTaskBadgeRef } from "./TaskBadgeRefContext";
import TaskBadgeBlobs from "./TaskBadgeBlobs";

interface SessionGridViewProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  className?: string;
  initialSelectedBackgroundId?: string;
  onBackgroundSelect?: (id: string) => void;
  onAccentColorChange?: (color?: string) => void;
  exportRef?: React.RefObject<HTMLDivElement>;
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
                loading="eager"
                decoding="async"
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
  onAccentColorChange,
  exportRef,
}: SessionGridViewProps) => {
  // Use shared media hook
  const { allPhotos, lastPhoto } = useSessionMedia({
    screenshots,
    webcamPhotos,
  });

  return (
    <SessionFrame
      ref={exportRef ?? undefined}
      imageSrc={lastPhoto}
      taskName={taskName}
      duration={duration}
      initialSelectedBackgroundId={initialSelectedBackgroundId}
      onBackgroundSelect={onBackgroundSelect}
      onAccentColorChange={onAccentColorChange}
      badgePosition="none"
      backgroundSurface="session_grid"
      className={className}
    >
      <GridContent photos={allPhotos} taskName={taskName} duration={duration} />
    </SessionFrame>
  );
};

/** Inner component to access taskBadgeRef via context */
function GridContent({
  photos,
  taskName,
  duration,
}: {
  photos: string[];
  taskName: string;
  duration: number;
}) {
  const taskBadgeRef = useTaskBadgeRef();
  const badgeAccentColor = useTaskBadgeAccentColor();

  return (
    <div className="w-full h-full overflow-auto flex justify-center items-center">
      <Tilt
        className="w-[55%] sm:w-[35%] md:w-[29%] mb-11"
        rotationFactor={6}
        springOptions={{ stiffness: 300, damping: 30 }}
      >
        <motion.div
          className="p-1 bg-white rounded-xl w-full"
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
            <FillGrid photos={photos} />
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
              <TaskBadgeBlobs accentColor={badgeAccentColor} />
              <span className="relative z-10">
                {taskName} • {duration} min
              </span>
            </div>
          </div>
        </motion.div>
      </Tilt>
    </div>
  );
}

export default SessionGridView;
