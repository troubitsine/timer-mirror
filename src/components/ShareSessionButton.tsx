import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import BackgroundColorSelector from "./BackgroundColorSelector";
import AnimatedTabs from "./ui/animated-tabs";
import { useDynamicBackground } from "@/lib/useDynamicBackground";
import ShareSessionMontage from "./ShareSessionMontage";
import ShareSessionGridView from "./ShareSessionGridView";
import ShareWatermark from "./ShareWatermark";
import { AnimatedShinyText } from "./ui/AnimatedShinyText";
import { cn } from "@/lib/utils";
import {
  exportSessionImage,
  fileFromBlob,
  generateShareFilename,
  persistBlobToOpfs,
  pngBlobToJpegBlob,
} from "@/lib/exportSessionImage";
import {
  EXPORT_SHARE_TEXT,
  EXPORT_SHARE_TITLE,
  EXPORT_MOBILE_PIXEL_RATIO,
} from "@/lib/exportConfig";
import { isMobileDevice } from "@/lib/deviceDetection";

interface ShareSessionButtonProps {
  taskName: string;
  duration: number;
  className?: string;
  screenshots?: string[];
  webcamPhotos?: string[];
  exportRef?: React.RefObject<HTMLDivElement>;
  selectedBackgroundId?: string;
  onBackgroundChange?: (id: string) => void;
}

type AspectRatio = "16:9" | "1:1" | "9:16";
type ViewMode = "stack" | "card";

const ShareSessionButton = ({
  taskName,
  duration,
  className = "",
  screenshots = [],
  webcamPhotos = [],
  exportRef,
  selectedBackgroundId: externalSelectedBackgroundId,
  onBackgroundChange,
}: ShareSessionButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [viewMode, setViewMode] = useState<ViewMode>("stack");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const dialogBodyRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [chromeHeight, setChromeHeight] = useState(0);
  const isMountedRef = useRef(true);

  // Use sessionStorage to persist the selected background ID across page refreshes
  const initialSelectedBackgroundId = useMemo(() => {
    const savedId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("selectedBackgroundId")
        : null;
    return externalSelectedBackgroundId || savedId || "white";
  }, [externalSelectedBackgroundId]);

  const handleBackgroundChange = useCallback(
    (id: string) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("selectedBackgroundId", id);
      }
      onBackgroundChange?.(id);
    },
    [onBackgroundChange],
  );

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
    initialSelectedBackgroundId,
    handleBackgroundChange,
  );

  useEffect(() => {
    if (
      externalSelectedBackgroundId &&
      externalSelectedBackgroundId !== currentBackgroundId
    ) {
      setCurrentBackgroundId(externalSelectedBackgroundId);
    }
  }, [
    externalSelectedBackgroundId,
    currentBackgroundId,
    setCurrentBackgroundId,
  ]);

  const shimmerColor =
    selectedBackground?.accentColor ?? "rgba(255, 255, 255, 0.85)";

  const isMobile =
    typeof window !== "undefined" ? isMobileDevice() : false;
  const foregroundScale = isMobile ? 1 : 0.67;

  const handleShare = async () => {
    if (isMobile) {
      const targetNode = exportRef?.current;
      if (!targetNode) {
        console.warn("ShareSessionButton: export target unavailable");
        return;
      }

      setIsGeneratingImage(true);

      const trimmedTask = taskName?.trim();
      const durationLabel = `${duration} minute${duration === 1 ? "" : "s"}`;
      const shareTitle = trimmedTask
        ? `${EXPORT_SHARE_TITLE}: ${trimmedTask}`
        : EXPORT_SHARE_TITLE;
      const shareText = `${
        trimmedTask ? `${trimmedTask} • ${durationLabel}` : durationLabel
      } · ${EXPORT_SHARE_TEXT}`;

      const openFallback = (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      };

      let cleanupPersistedFile: (() => Promise<void>) | null = null;
      let exportContainer: HTMLDivElement | null = null;

      try {
        const rect = targetNode.getBoundingClientRect();
        const normalizedWidth = Math.max(
          1,
          rect.width || targetNode.offsetWidth || targetNode.clientWidth,
        );
        const normalizedHeight = Math.max(
          1,
          rect.height || targetNode.offsetHeight || targetNode.clientHeight,
        );

        const clonedRoot = targetNode.cloneNode(true) as HTMLDivElement;
        clonedRoot.style.width = `${normalizedWidth}px`;
        clonedRoot.style.height = `${normalizedHeight}px`;
        clonedRoot.style.maxWidth = `${normalizedWidth}px`;
        clonedRoot.style.maxHeight = `${normalizedHeight}px`;

        if (targetNode.hasAttribute("data-share-export-root")) {
          clonedRoot.setAttribute("data-share-export-root", "");
        }

        const computedStyles = window.getComputedStyle(targetNode);
        const backgroundImage = computedStyles?.backgroundImage || "";
        if (
          backgroundImage &&
          /\bgradient\(/i.test(backgroundImage) &&
          backgroundImage !== "none"
        ) {
          clonedRoot.dataset.exportSurface = "gradient";
        } else {
          delete clonedRoot.dataset.exportSurface;
        }

        clonedRoot.dataset.exporting = "true"; // Isolate export styles so the live UI never flashes the watermark.
        exportContainer = document.createElement("div");
        Object.assign(exportContainer.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "0",
          height: "0",
          opacity: "0",
          pointerEvents: "none",
          overflow: "hidden",
        });
        exportContainer.setAttribute("aria-hidden", "true");
        exportContainer.appendChild(clonedRoot);
        document.body.appendChild(exportContainer);

        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(undefined)),
        );

        const { blob: pngBlob } = await exportSessionImage(clonedRoot, {
          pixelRatio: EXPORT_MOBILE_PIXEL_RATIO,
        });

        let shareBlob: Blob = pngBlob;
        let shareFile: File;

        try {
          const jpegBlob = await pngBlobToJpegBlob(
            pngBlob,
            computedStyles?.backgroundColor,
          );
          shareBlob = jpegBlob;
          const jpegFilename = generateShareFilename("jpeg", {
            taskName,
            durationMinutes: duration,
          });
          shareFile = fileFromBlob(jpegBlob, jpegFilename, "image/jpeg");
        } catch (conversionError) {
          console.warn(
            "ShareSessionButton: JPEG conversion failed, falling back to PNG",
            conversionError,
          );
          const pngFilename = generateShareFilename("png", {
            taskName,
            durationMinutes: duration,
          });
          shareFile = fileFromBlob(pngBlob, pngFilename, "image/png");
        }

        // iOS-specific check
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

        // Build ShareData based on platform
        const shareFiles: File[] = [shareFile];

        if (isIOS) {
          // iOS Safari only shows share previews for files persisted to disk,
          // so we persist the blob in OPFS and swap in the resulting File.
          const persisted = await persistBlobToOpfs(shareBlob, shareFile.name);
          if (persisted) {
            shareFiles.splice(0, shareFiles.length, persisted.file);
            cleanupPersistedFile = persisted.cleanup;
          }
        }

        const data: ShareData = isIOS
          ? { files: shareFiles }
          : { files: shareFiles, title: shareTitle, text: shareText };

        if (navigator.share) {
          if (!navigator.canShare || navigator.canShare({ files: shareFiles })) {
            try {
              await navigator.share(data);
              return;
            } catch (err) {
              if (err instanceof DOMException && err.name === "AbortError") {
                return; // user cancelled, no fallback
              }
              console.warn("ShareSessionButton: navigator.share failed", err);
            }
          }
        }

        openFallback(shareBlob);
      } catch (error) {
        console.error("ShareSessionButton: mobile share failed", error);
      } finally {
        if (exportContainer?.parentNode) {
          exportContainer.remove();
        }
        if (cleanupPersistedFile) {
          await cleanupPersistedFile();
        }
        if (isMountedRef.current) {
          setIsGeneratingImage(false);
        }
      }
      return;
    }

    setIsDialogOpen(true);
  };

  // Handle download functionality
  const forceInlineImageLoad = (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll("img"));
    images.forEach((img) => {
      const image = img as HTMLImageElement & { loading?: string };
      if (image.loading === "lazy") {
        image.loading = "eager";
      }
      if ("decoding" in image) {
        image.decoding = "sync";
      }
    });
  };

  const ensureImagesDecoded = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll("img"));
    if (images.length === 0) return;

    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        if ("decode" in img) {
          return (img as HTMLImageElement & {
            decode?: () => Promise<void>;
          })
            .decode?.()
            .catch(() => undefined);
        }

        return new Promise<void>((resolve) => {
          const image = img as HTMLImageElement;
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      }),
    );
  };

  const handleDownload = async () => {
    const previewRoot = previewRef.current;
    if (!previewRoot) return;
    setIsGeneratingImage(true);
    let exportContainer: HTMLDivElement | null = null;

    try {
      forceInlineImageLoad(previewRoot);
      await ensureImagesDecoded(previewRoot);

      const rect = previewRoot.getBoundingClientRect();
      const normalizedWidth = Math.max(
        1,
        rect.width || previewRoot.offsetWidth || previewRoot.clientWidth,
      );
      const normalizedHeight = Math.max(
        1,
        rect.height || previewRoot.offsetHeight || previewRoot.clientHeight,
      );

      const clonedRoot = previewRoot.cloneNode(true) as HTMLDivElement;
      clonedRoot.dataset.exporting = "true";
      clonedRoot.style.width = `${normalizedWidth}px`;
      clonedRoot.style.height = `${normalizedHeight}px`;
      clonedRoot.style.maxWidth = `${normalizedWidth}px`;
      clonedRoot.style.maxHeight = `${normalizedHeight}px`;

      const computedStyles = window.getComputedStyle(previewRoot);
      const backgroundImage = computedStyles?.backgroundImage || "";
      if (backgroundImage && /\bgradient\(/i.test(backgroundImage) && backgroundImage !== "none") {
        clonedRoot.dataset.exportSurface = "gradient";
      } else {
        delete clonedRoot.dataset.exportSurface;
      }

      exportContainer = document.createElement("div");
      Object.assign(exportContainer.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "0",
        height: "0",
        opacity: "0",
        pointerEvents: "none",
        overflow: "hidden",
      });
      exportContainer.setAttribute("aria-hidden", "true");
      exportContainer.appendChild(clonedRoot);
      document.body.appendChild(exportContainer);

      // Give the browser a frame to apply export-only styling on the clone.
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(undefined)),
      );

      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(clonedRoot, {
        pixelRatio: 6,
      });

      const link = document.createElement("a");
      link.download = `${taskName.replace(/\s+/g, "-").toLowerCase()}-${duration}min.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image:", err);
    } finally {
      if (exportContainer?.parentNode) {
        exportContainer.remove();
      }
      if (isMountedRef.current) {
        setIsGeneratingImage(false);
      }
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewportMetrics = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };

    updateViewportMetrics();
    window.addEventListener("resize", updateViewportMetrics);

    return () => {
      window.removeEventListener("resize", updateViewportMetrics);
    };
  }, []);

  useEffect(() => {
    if (!isDialogOpen) {
      setMeasuredWidth(0);
      return;
    }

    const boundsElement = dialogBodyRef.current;
    if (!boundsElement) {
      return;
    }

    const computeInnerWidth = (rawWidth: number) => {
      const styles = window.getComputedStyle(boundsElement);
      const paddingLeft = Number.parseFloat(styles.paddingLeft || "0");
      const paddingRight = Number.parseFloat(styles.paddingRight || "0");
      const totalPadding = (Number.isFinite(paddingLeft) ? paddingLeft : 0) +
        (Number.isFinite(paddingRight) ? paddingRight : 0);

      return Math.max(0, rawWidth - totalPadding);
    };

    const updateMeasuredWidth = () => {
      const rectWidth = boundsElement.getBoundingClientRect().width;
      setMeasuredWidth(computeInnerWidth(rectWidth || 0));
    };

    if (typeof ResizeObserver === "undefined") {
      updateMeasuredWidth();
      window.addEventListener("resize", updateMeasuredWidth);

      return () => {
        window.removeEventListener("resize", updateMeasuredWidth);
      };
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setMeasuredWidth(computeInnerWidth(entry.contentRect.width));
      }
    });

    observer.observe(boundsElement);
    updateMeasuredWidth();

    return () => {
      observer.disconnect();
    };
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen) {
      setChromeHeight(0);
      return;
    }

    const bodyElement = dialogBodyRef.current;
    const previewContainerElement = previewContainerRef.current;

    if (!bodyElement || !previewContainerElement) {
      return;
    }

    const calculateChromeHeight = () => {
      const styles = window.getComputedStyle(bodyElement);
      const paddingTop = Number.parseFloat(styles.paddingTop || "0");
      const paddingBottom = Number.parseFloat(styles.paddingBottom || "0");
      const verticalPadding = (Number.isFinite(paddingTop) ? paddingTop : 0) +
        (Number.isFinite(paddingBottom) ? paddingBottom : 0);

      const totalChrome = bodyElement.scrollHeight -
        previewContainerElement.offsetHeight -
        verticalPadding;

      setChromeHeight(Math.max(0, totalChrome));
    };

    calculateChromeHeight();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", calculateChromeHeight);

      return () => {
        window.removeEventListener("resize", calculateChromeHeight);
      };
    }

    const observer = new ResizeObserver(() => {
      calculateChromeHeight();
    });

    observer.observe(bodyElement);
    observer.observe(previewContainerElement);

    return () => {
      observer.disconnect();
    };
  }, [
    isDialogOpen,
    aspectRatio,
    viewMode,
    measuredWidth,
    viewportHeight,
    viewportWidth,
    hasDynamicColors,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const previewDimensions = useMemo(() => {
    const fallbackWidth = 600;
    const horizontalGutters = 24 + 32;
    const viewportBudget = viewportWidth
      ? Math.max(0, viewportWidth - horizontalGutters)
      : Infinity;
    const availableWidth = Math.max(
      0,
      Math.min(measuredWidth || fallbackWidth, viewportBudget, 650),
    );
    const normalizedAvailableWidth = Number.isFinite(availableWidth)
      ? Math.max(availableWidth, 0)
      : fallbackWidth;

    const maxPreviewHeight = viewportHeight
      ? Math.max(
        0,
        Math.min(viewportHeight * 0.5, viewportHeight * 0.9 - chromeHeight),
      )
      : Infinity;
    const baselineHeight = (normalizedAvailableWidth * 9) / 16;

    let height = baselineHeight;
    let widthForSixteenByNine = normalizedAvailableWidth;

    if (Number.isFinite(maxPreviewHeight) && baselineHeight > maxPreviewHeight) {
      height = maxPreviewHeight as number;
      widthForSixteenByNine = Math.min(
        (height * 16) / 9,
        normalizedAvailableWidth,
      );
    }

    if (!Number.isFinite(height) || height <= 0) {
      height = (fallbackWidth * 9) / 16;
      widthForSixteenByNine = fallbackWidth;
    }

    const clampWidth = (value: number) => {
      if (!Number.isFinite(value)) {
        return widthForSixteenByNine;
      }

      return Math.min(Math.max(value, 0), normalizedAvailableWidth);
    };

    const widthByAspect: Record<AspectRatio, number> = {
      "16:9": clampWidth(widthForSixteenByNine),
      "1:1": clampWidth(height),
      "9:16": clampWidth((height * 9) / 16),
    };

    const width = widthByAspect[aspectRatio] ?? widthByAspect["16:9"];
    const normalizedHeight = Number.isFinite(height) && height > 0
      ? height
      : (fallbackWidth * 9) / 16;

    return {
      width,
      height: normalizedHeight,
      maxPreviewHeight: Number.isFinite(maxPreviewHeight)
        ? (maxPreviewHeight as number)
        : undefined,
    };
  }, [aspectRatio, measuredWidth, viewportHeight, viewportWidth, chromeHeight]);

  const previewStyle = useMemo(() => {
    const { width, height, maxPreviewHeight } = previewDimensions;

    const style: React.CSSProperties = {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: "100%",
    };

    if (typeof maxPreviewHeight === "number") {
      style.maxHeight = `${maxPreviewHeight}px`;
    }

    return style;
  }, [previewDimensions]);

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleShare}
        disabled={isMobile && isGeneratingImage}
        type="button"
        className={cn(
          "bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/70 backdrop-blur-md flex items-center gap-1 rounded-full inner-stroke-white-20-sm sm:px-[10px] py-[6px] px-[12px]",
          className,
        )}
      >
        <AnimatedShinyText
          shimmerColor={shimmerColor}
          shimmerWidth={160}
          className="text-xs font-medium leading-none"
        >
          Share
        </AnimatedShinyText>
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

            <div
              ref={dialogBodyRef}
              className="flex flex-col gap-4 py-4"
            >
              {/* Preview container with aspect ratio wrapper */}
              <div className="w-full">
                <div
                  ref={previewContainerRef}
                  className="relative mx-auto overflow-hidden"
                  style={previewStyle}
                >
                  <div
                    ref={previewRef}
                    data-share-export-root
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
                    <ShareWatermark scale={foregroundScale} />
                  </div>
                </div>
              </div>

              {/* Customization controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:grid sm:grid-cols-3 sm:gap-4 mt-2">
                {/* Background selector */}
                {hasDynamicColors && (
                  <div className="flex flex-1 min-w-[140px] justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-white/70">Background</span>
                      <BackgroundColorSelector
                        options={backgroundOptions}
                        selectedId={currentBackgroundId}
                        onSelect={setCurrentBackgroundId}
                        className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
                      />
                    </div>
                  </div>
                )}

                {/* Aspect ratio selector */}
                <div className="flex flex-1 min-w-[140px] justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-white/70">Aspect Ratio</span>
                    <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[3px] inner-stroke-white-20-sm shadow-sm w-fit min-h-[32px]">
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
                </div>

                {/* View mode selector */}
                <div className="flex flex-1 min-w-[140px] justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-white/70">View Style</span>
                    <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[3px] inner-stroke-white-20-sm shadow-sm w-fit min-h-[32px]">
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
