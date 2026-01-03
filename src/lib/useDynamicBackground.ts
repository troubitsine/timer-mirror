import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Vibrant } from "node-vibrant/browser";
import { isMobileDevice } from "./deviceDetection";

export type BackgroundOption = {
  id: string;
  name: string;
  style?: React.CSSProperties;
  className?: string;
  accentColor: string;
};

export function useDynamicBackground(
  imageSrc: string | null,
  initialSelectedId?: string,
  onSelect?: (id: string) => void,
) {
  const isMobile = isMobileDevice();

  const plainWhiteBackground = useMemo<BackgroundOption>(
    () => ({
      id: "white",
      name: "White",
      className: "bg-white",
      accentColor: "#ffffff",
    }),
    [],
  );

  const [backgroundOptions, setBackgroundOptions] = useState<BackgroundOption[]>(
    [plainWhiteBackground],
  );
  const [hasDynamicColors, setHasDynamicColors] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(
    initialSelectedId || "white",
  );

  const selectedBackground = backgroundOptions.find(
    (option) => option.id === selectedBackgroundId,
  );

  const taskBadgeRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  const handleBackgroundSelect = useCallback(
    (id: string) => {
      setSelectedBackgroundId(id);
      sessionStorage.setItem("selectedBackgroundId", id);
      if (onSelect) {
        onSelect(id);
      }
    },
    [onSelect],
  );

  const extractColorsFromImage = useCallback(
    async (image: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        const palette = await Vibrant.from(image).getPalette();

        const dynamicOptions: BackgroundOption[] = [];

        if (palette.Vibrant && palette.LightVibrant) {
          if (isMobile) {
            dynamicOptions.push({
              id: "mobileVibrant",
              name: "Vibrant",
              className: `bg-[${palette.Vibrant.hex}]`,
              style: { backgroundColor: palette.Vibrant.hex },
              accentColor: palette.Vibrant.hex,
            });
          } else {
            dynamicOptions.push({
              id: "dynamicGradient",
              name: "Dynamic Gradient",
              style: {
                backgroundImage: `
        radial-gradient(circle at 15%   100%, ${palette.Vibrant.hex}cc       0%, transparent 70%),
        radial-gradient(circle at 80%  60%, ${palette.LightVibrant.hex}66  0%, transparent 95%),
        radial-gradient(circle at 100%   0%, ${palette.Vibrant.hex}       0%, transparent 70%)
      `,
                backgroundColor: palette.LightVibrant.hex,
              },
              accentColor: palette.Vibrant.hex,
            });
          }

          if (taskBadgeRef.current) {
            const vibrantColor = palette.Vibrant.hex;
            const lightVibrantColor = palette.LightVibrant.hex;

            const toRgba = (hex: string, opacity: number) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            };

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

            taskBadgeRef.current.style.setProperty(
              "--border-color-1",
              toRgba(lightVibrantColor, 0.1),
            );
            taskBadgeRef.current.style.setProperty(
              "--border-color-2",
              toRgba(vibrantColor, 0.1),
            );
          }
        }

        if (palette.LightVibrant) {
          dynamicOptions.push({
            id: "lightVibrant",
            name: "Light Vibrant",
            className: `bg-[${palette.LightVibrant.hex}]`,
            style: { backgroundColor: palette.LightVibrant.hex },
            accentColor: palette.LightVibrant.hex,
          });
        }

        if (palette.Muted) {
          dynamicOptions.push({
            id: "muted",
            name: "Muted",
            className: `bg-[${palette.Muted.hex}]`,
            style: { backgroundColor: palette.Muted.hex },
            accentColor: palette.Muted.hex,
          });
        }

        if (palette.LightMuted) {
          dynamicOptions.push({
            id: "lightMuted",
            name: "Light Muted",
            className: `bg-[${palette.LightMuted.hex}]`,
            style: { backgroundColor: palette.LightMuted.hex },
            accentColor: palette.LightMuted.hex,
          });
        }

        if (dynamicOptions.length > 0) {
          setBackgroundOptions(dynamicOptions);
          const currentIdExists = dynamicOptions.some(
            (option) => option.id === selectedBackgroundId,
          );
          if (!currentIdExists) {
            handleBackgroundSelect(dynamicOptions[0].id);
          }
          setHasDynamicColors(true);
        } else {
          setBackgroundOptions([plainWhiteBackground]);
          if (selectedBackgroundId !== "white") {
            handleBackgroundSelect("white");
          }
          setHasDynamicColors(false);
        }
      } catch (error) {
        console.error("Error extracting colors from image:", error);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [
      handleBackgroundSelect,
      isMobile,
      plainWhiteBackground,
      selectedBackgroundId,
    ],
  );

  useEffect(() => {
    if (!imageSrc) return;
    extractColorsFromImage(imageSrc);

    return () => {
      isProcessingRef.current = false;
    };
  }, [imageSrc, extractColorsFromImage]);

  return {
    backgroundOptions,
    selectedBackgroundId,
    setSelectedBackgroundId: handleBackgroundSelect,
    selectedBackground,
    hasDynamicColors,
    taskBadgeRef,
  };
}
