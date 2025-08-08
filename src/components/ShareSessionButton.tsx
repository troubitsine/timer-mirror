import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Share2, Download } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import BackgroundColorSelector from "./BackgroundColorSelector";
import AnimatedTabs from "./ui/animated-tabs";
import { useDynamicBackground } from "@/lib/useDynamicBackground";
import ShareSessionMontage from "./ShareSessionMontage";
import ShareSessionGridView from "./ShareSessionGridView";
import { cn } from "@/lib/utils";

interface ShareSessionButtonProps {
  taskName: string;
  duration: number;
  className?: string;
  screenshots?: string[];
  webcamPhotos?: string[];
}

type AspectRatio = "16:9" | "1:1" | "9:16";
type ViewMode = "stack" | "card";

const ShareSessionButton = ({
  taskName,
  duration,
  className = "",
  screenshots = [],
  webcamPhotos = [],
}: ShareSessionButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [viewMode, setViewMode] = useState<ViewMode>("stack");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Use sessionStorage to persist the selected background ID across page refreshes
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(() => {
    const savedId = sessionStorage.getItem("selectedBackgroundId");
    return savedId || "white";
  });

  // Get the last photo for color extraction
  const lastPhoto =
    screenshots.length > 0
      ? screenshots[screenshots.length - 1]
      : webcamPhotos.length > 0
        ? webcamPhotos[webcamPhotos.length - 1]
        : null;

  // Use the dynamic background hook
  const {
    selectedBackground,
    selectedBackgroundId: currentBackgroundId,
    setSelectedBackgroundId: setCurrentBackgroundId,
    backgroundOptions,
    hasDynamicColors,
  } = useDynamicBackground(
    lastPhoto,
    selectedBackgroundId,
    setSelectedBackgroundId,
  );

  const handleShare = async () => {
    setIsDialogOpen(true);
  };

  // Calculate aspect ratio dimensions
  const getAspectRatioDimensions = () => {
    // Base dimensions for each aspect ratio
    let dimensions = {
      width: 0,
      height: 0,
    };

    switch (aspectRatio) {
      case "16:9":
        dimensions = { width: 16, height: 9 };
        break;
      case "1:1":
        dimensions = { width: 1, height: 1 };
        break;
      case "9:16":
        dimensions = { width: 9, height: 16 };
        break;
      default:
        dimensions = { width: 16, height: 9 };
    }

    return dimensions;
  };

  // Handle download functionality
  const handleDownload = async () => {
    if (!previewRef.current) return;
    setIsGeneratingImage(true);

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(previewRef.current, {
        backgroundColor: null,
        pixelRatio: 6,
        cacheBust: true,
        // Override the style on the clone only - no flicker
        style: { borderRadius: "0px" },
      });

      const link = document.createElement("a");
      link.download = `${taskName.replace(/\s+/g, "-").toLowerCase()}-${duration}min.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Load html-to-image script when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // Preload html-to-image
      import("html-to-image").catch((err) => {
        console.error("Failed to load html-to-image:", err);
      });
    }
  }, [isDialogOpen]);

  return (
    <>
      <Button
        onClick={handleShare}
        variant="secondary"
        size="sm"
        className={`bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/70 backdrop-blur-md flex items-center gap-1 rounded-full inner-stroke-white-20-sm sm:pl-[8px] sm:pr-[10px] py-[6px] pl-[10px] pr-[12px] ${className}`}
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="fixed left-3 right-3 top-[10vh] sm:top-[5vh] translate-x-0 translate-y-0 sm:left-1/2 sm:-translate-x-1/2 p-0 border-none overflow-auto max-h-[90vh] w-auto max-w-full sm:max-w-[650px] sm:w-full mx-0 sm:mx-4 bg-transparent rounded-[18px] pb-[env(safe-area-inset-bottom)] sm:pb-0">
          <div
            className="p-1.5 bg-neutral-700/70
             before:absolute before:inset-0 before:bg-gradient-to-br before:from-neutral-400/40 before:to-transparent sm:before:rounded-[18px] before:pointer-events-none
             backdrop-blur-md rounded-t-[18px] relative flex flex-col"
          >
            {/* Close button */}
            <div className="absolute right-[11px] top-[11px] z-20">
              <DialogClose asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm p-2"
                >
                  <Cross2Icon className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>

            <DialogHeader className="flex flex-col mb-0 text-left px-4 pt-4">
              <DialogTitle className="text-lg font-semibold text-white/85 z-10 flex-shrink-0 text-left">
                Share your progress
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4 px-4">
              {/* Preview container with aspect ratio wrapper */}
              <div
                className="relative mx-auto overflow-hidden max-h-[50vh]"
                style={(() => {
                  const { width, height } = getAspectRatioDimensions();
                  const maxHeight = window.innerHeight * 0.5; // 50vh
                  const containerWidth = aspectRatio === "9:16" ? 300 : 600;

                  // Calculate the height based on the aspect ratio and available width
                  let calculatedHeight = (containerWidth * height) / width;
                  let calculatedWidth = containerWidth;

                  // If the calculated height exceeds the max height, recalculate width
                  if (calculatedHeight > maxHeight) {
                    calculatedHeight = maxHeight;
                    calculatedWidth = (maxHeight * width) / height;
                  }

                  return {
                    width: `${calculatedWidth}px`,
                    height: `${calculatedHeight}px`,
                    maxWidth: "100%",
                  };
                })()}
              >
                <div
                  ref={previewRef}
                  className={cn(
                    "w-full h-full relative overflow-hidden rounded-xl",
                    selectedBackground?.className,
                  )}
                  style={selectedBackground?.style}
                >
                  {/* Session preview based on view mode */}
                  {viewMode === "stack" ? (
                    <ShareSessionMontage
                      screenshots={screenshots}
                      webcamPhotos={webcamPhotos}
                      taskName={taskName}
                      duration={duration}
                      initialSelectedBackgroundId={currentBackgroundId}
                      onBackgroundSelect={setCurrentBackgroundId}
                      selectedBackgroundId={currentBackgroundId}
                      setSelectedBackgroundId={setCurrentBackgroundId}
                      hideControls={true}
                      aspectRatio={aspectRatio}
                    />
                  ) : (
                    <ShareSessionGridView
                      screenshots={screenshots}
                      webcamPhotos={webcamPhotos}
                      taskName={taskName}
                      duration={duration}
                      initialSelectedBackgroundId={currentBackgroundId}
                      onBackgroundSelect={setCurrentBackgroundId}
                      selectedBackgroundId={currentBackgroundId}
                      setSelectedBackgroundId={setCurrentBackgroundId}
                      className="rounded-xl"
                      aspectRatio={aspectRatio}
                    />
                  )}
                </div>
              </div>

              {/* Customization controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {/* Background selector */}
                {hasDynamicColors && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-white/70">Background</span>
                    <BackgroundColorSelector
                      options={backgroundOptions}
                      selectedId={currentBackgroundId}
                      onSelect={setCurrentBackgroundId}
                      className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
                    />
                  </div>
                )}

                {/* Aspect ratio selector */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-white/70">Aspect Ratio</span>
                  <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[3px] inner-stroke-white-20-sm shadow-sm min-w-[120px] min-h-[32px]">
                    <AnimatedTabs
                      defaultValue={aspectRatio}
                      onValueChange={(value) =>
                        setAspectRatio(value as AspectRatio)
                      }
                      className="rounded-full bg-gradient-to-b from-white/20 via-neutral-400/30 to-neutral-500/30 backdrop-blur-sm shadow-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)]"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.3,
                      }}
                    >
                      <button
                        data-id="16:9"
                        type="button"
                        className="px-3 pt-[1px] pb-[4px] text-black/75 transition-colors duration-300 flex items-center gap-1.5 rounded-full min-h-[28px]"
                      >
                        <span className="text-xs font-medium">16:9</span>
                      </button>
                      <button
                        data-id="1:1"
                        type="button"
                        className="px-3 pt-[1px] pb-[4px] text-black/75 transition-colors duration-300 flex items-center gap-1.5 rounded-full min-h-[28px]"
                      >
                        <span className="text-xs font-medium">1:1</span>
                      </button>
                      <button
                        data-id="9:16"
                        type="button"
                        className="px-3 pt-[1px] pb-[4px] text-black/75 transition-colors duration-300 flex items-center gap-1.5 rounded-full min-h-[28px]"
                      >
                        <span className="text-xs font-medium">9:16</span>
                      </button>
                    </AnimatedTabs>
                  </div>
                </div>

                {/* View mode selector */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-white/70">View Style</span>
                  <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[3px] inner-stroke-white-20-sm shadow-sm min-w-[120px] min-h-[32px]">
                    <AnimatedTabs
                      defaultValue={viewMode}
                      onValueChange={(value) => setViewMode(value as ViewMode)}
                      className="rounded-full bg-gradient-to-b from-white/20 via-neutral-400/30 to-neutral-500/30 backdrop-blur-sm shadow-sm shadow-[inset_0_0_0_1px_rgba(255,255,255,0.32)]"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.3,
                      }}
                    >
                      <button
                        data-id="stack"
                        type="button"
                        className="px-3 pt-[1px] pb-[4px] text-black/75 transition-colors duration-300 flex items-center gap-1.5 rounded-full min-h-[28px]"
                      >
                        <span className="text-xs font-medium">Stack</span>
                      </button>
                      <button
                        data-id="card"
                        type="button"
                        className="px-3 pt-[1px] pb-[4px] text-black/75 transition-colors duration-300 flex items-center gap-1.5 rounded-full min-h-[28px]"
                      >
                        <span className="text-xs font-medium">Card</span>
                      </button>
                    </AnimatedTabs>
                  </div>
                </div>
              </div>

              {/* Download button */}
              <div className="flex justify-center mt-2">
                <Button
                  onClick={handleDownload}
                  disabled={isGeneratingImage}
                  className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center justify-center gap-2 rounded-full inner-stroke-white-20-sm px-6 py-2"
                >
                  <Download className="h-4 w-4" />
                  {isGeneratingImage ? "Generating..." : "Download Image"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareSessionButton;
