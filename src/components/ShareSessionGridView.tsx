import React, {
  useRef,
  useLayoutEffect,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { isMobileDevice } from "@/lib/deviceDetection";
import BackgroundColorSelector from "./BackgroundColorSelector";
import Tilt from "./Tilt";
import { motion } from "framer-motion";
import { useDynamicBackground } from "@/lib/useDynamicBackground";

interface ShareSessionGridViewProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  className?: string;
  initialSelectedBackgroundId?: string;
  onBackgroundSelect?: (id: string) => void;
  selectedBackgroundId?: string;
  setSelectedBackgroundId?: (id: string) => void;
  aspectRatio?: "16:9" | "1:1" | "9:16";
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

const ShareSessionGridView = ({
  screenshots = [],
  webcamPhotos = [],
  taskName = "Focus Session",
  duration = 25,
  className,
  initialSelectedBackgroundId,
  onBackgroundSelect,
  selectedBackgroundId: externalSelectedBackgroundId,
  setSelectedBackgroundId: externalSetSelectedBackgroundId,
  aspectRatio = "16:9",
}: ShareSessionGridViewProps) => {
  const isMobile = isMobileDevice();
  const foregroundScale = isMobile ? 1 : 0.67;

  // Keep your aspect→width preference per ratio (tuned for 9:16)
  const WIDTH_PCT: Record<
    NonNullable<ShareSessionGridViewProps["aspectRatio"]>,
    number
  > = {
    "16:9": 0.7,
    "1:1": 0.68,
    "9:16": 0.76, // ↓ from 0.85 so portrait doesn't press the edges
  };

  // Minimum presence (as a fraction of container height)
  const MIN_CARD_H_RATIO: Record<
    NonNullable<ShareSessionGridViewProps["aspectRatio"]>,
    number
  > = {
    "16:9": 0.42,
    "1:1": 0.44,
    "9:16": 0.5, // a bit larger so tall cards don't look spindly
  };

  // Transform clearance (px) so Tilt never clips (used as padding on the wrapper)
  const TILT_BLEED_PX: Record<
    NonNullable<ShareSessionGridViewProps["aspectRatio"]>,
    number
  > = {
    "16:9": 12,
    "1:1": 14,
    "9:16": 18, // more headroom for taller cards
  };

  const widthPercentage = WIDTH_PCT[aspectRatio];
  const tiltBleed = TILT_BLEED_PX[aspectRatio];

  // NEW: refs to measure the available container and compute a bounded width
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cardWidthPx, setCardWidthPx] = useState<number | undefined>(undefined);

  // Combine photos based on device type
  const allPhotos = useMemo(() => {
    // Simple filter for valid images
    const validScreenshots = screenshots.filter(Boolean);
    const validWebcamPhotos = webcamPhotos.filter(Boolean);

    // Check if we have valid screenshots available
    const hasScreenshots = validScreenshots.length > 0;

    if (isMobile || !hasScreenshots) {
      // On mobile or when no valid screenshots are available, only use webcam photos
      return [...validWebcamPhotos];
    } else {
      // For desktop with valid screenshots, combine screenshots and webcam photos
      const combined = [];
      const maxLength = Math.max(
        validScreenshots.length,
        validWebcamPhotos.length,
      );

      for (let i = 0; i < maxLength; i++) {
        if (validScreenshots[i]) combined.push(validScreenshots[i]);
        if (validWebcamPhotos[i]) combined.push(validWebcamPhotos[i]);
      }

      return combined;
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

  // ---- NEW: Size logic based on container height with min/max rules ----
  const recomputeCardWidth = useCallback(() => {
    const container = wrapperRef.current;
    if (!container) return;

    // Usable space (we already padded wrapper by tiltBleed)
    const cW = container.clientWidth - tiltBleed * 2;
    const cH = container.clientHeight - tiltBleed * 2;

    // Live badge height (wrap-aware)
    const badgeH =
      (taskBadgeRef?.current as HTMLElement | null)?.offsetHeight ?? 0;

    // Vertical chrome inside the card: p-1 top+bottom (8) + mt-1 (4) + tiny buffer
    const EXTRA_VERTICAL = 20;

    // Preferred width from the width policy (still capped by usable width below)
    const preferred = Math.round(cW * widthPercentage);

    // Height-bound width: gridH = w * FRAME_RATIO, totalH = gridH + badgeH + extras
    const maxWidthByHeight = Math.floor(
      (cH - badgeH - EXTRA_VERTICAL) / FRAME_RATIO,
    );

    // Minimum presence (fraction of container height), tuned per aspect & device
    const minRatio = isMobile
      ? Math.max(0, MIN_CARD_H_RATIO[aspectRatio] - 0.04)
      : MIN_CARD_H_RATIO[aspectRatio];

    const minHeightTarget = Math.max(0, Math.round(cH * minRatio));
    const minWidthByHeight = Math.ceil(
      Math.max(0, minHeightTarget - badgeH - EXTRA_VERTICAL) / FRAME_RATIO,
    );

    // Absolute px bounds
    const MIN_PX = 260;
    const lower = Math.max(MIN_PX, minWidthByHeight);
    // Upper bound must obey BOTH height and the usable width
    const upper = Math.max(120, Math.min(maxWidthByHeight, cW));

    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(Math.max(v, lo), hi);

    let nextWidth: number;
    if (upper < lower) {
      nextWidth = Math.max(120, upper); // tight space → fit to the smaller cap
    } else {
      nextWidth = clamp(preferred, lower, upper);
    }

    setCardWidthPx(
      Number.isFinite(nextWidth) ? Math.max(120, nextWidth) : undefined,
    );
  }, [widthPercentage, isMobile, taskBadgeRef, aspectRatio, tiltBleed]);

  // Recompute on:
  // - mount, resize of the wrapper, taskName changes (affects badge height),
  // - photo set changes (rarely changes height but keep it safe)
  useLayoutEffect(() => {
    recomputeCardWidth();
    const ro = new ResizeObserver(recomputeCardWidth);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    const badgeEl = (taskBadgeRef?.current as HTMLElement | null) ?? undefined;
    let bro: ResizeObserver | undefined;
    if (badgeEl) {
      bro = new ResizeObserver(recomputeCardWidth);
      bro.observe(badgeEl);
    }
    return () => {
      ro.disconnect();
      bro?.disconnect();
    };
  }, [recomputeCardWidth, taskName, allPhotos.length]);

  const exportBackgroundStyle = { ...(selectedBackground?.style ?? {}) };

  return (
    <Card
      className={cn(
        "w-full h-full relative overflow-hidden border-0",
        selectedBackground?.className,
        className,
      )}
      style={exportBackgroundStyle}
    >
      {selectedBackground?.className ? (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 pointer-events-none",
            selectedBackground.className,
          )}
          style={exportBackgroundStyle}
        />
      ) : null}
      {/* Fixed size container for grid layout */}
      <div
        ref={wrapperRef}
        className="w-full h-full overflow-hidden flex justify-center items-center"
        style={{ padding: `${tiltBleed}px` }} // ← gives transforms some air
      >
        {/* Tilt component without motion wrapper */}
        <div
          className="mb-2 flex justify-center items-center"
          style={
            !isMobile
              ? {
                  transform: `scale(${foregroundScale})`,
                  transformOrigin: "center",
                }
              : undefined
          }
        >
          <Tilt
            className="flex justify-center items-center"
            rotationFactor={6}
            springOptions={{ stiffness: 300, damping: 30 }}
          >
            <motion.div
              className="p-1 bg-white rounded-xl shadow-md w-full"
              style={{
                width: cardWidthPx ? `${cardWidthPx}px` : undefined,
                maxHeight: "100%",
              }}
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
                    fontSize: "0.7rem",
                    lineHeight: "1.15",
                    padding: "6px 12px",
                  }}
                >
                  {taskName} • {duration} {duration === 1 ? "min" : "min"}
                </div>
              </div>
            </motion.div>
          </Tilt>
        </div>
      </div>

      {/* Background color selector removed to avoid duplication */}
    </Card>
  );
};

export default ShareSessionGridView;
