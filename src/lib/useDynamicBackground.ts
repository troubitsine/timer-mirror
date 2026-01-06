// useDynamicBackground.ts
// Dynamic background hook for session surfaces; extracts palette and persists selection state.
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
  const backgroundOptionsRef = useRef(backgroundOptions);
  const [hasDynamicColors, setHasDynamicColors] = useState(false);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(
    initialSelectedId || "white",
  );

  const selectedBackground = backgroundOptions.find(
    (option) => option.id === selectedBackgroundId,
  );

  const taskBadgeRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    backgroundOptionsRef.current = backgroundOptions;
  }, [backgroundOptions]);

  const persistSelection = useCallback(
    (id: string, optionsOverride?: BackgroundOption[]) => {
      if (typeof window === "undefined") return;
      sessionStorage.setItem("selectedBackgroundId", id);
      const options = optionsOverride ?? backgroundOptionsRef.current;
      const selectedOption = options.find((option) => option.id === id);
      if (selectedOption?.accentColor) {
        sessionStorage.setItem(
          "selectedBackgroundAccentColor",
          selectedOption.accentColor,
        );
      }
    },
    [],
  );

  const handleBackgroundSelect = useCallback(
    (id: string, optionsOverride?: BackgroundOption[]) => {
      setSelectedBackgroundId(id);
      persistSelection(id, optionsOverride);
      if (onSelect) {
        onSelect(id);
      }
    },
    [onSelect, persistSelection],
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
            handleBackgroundSelect(dynamicOptions[0].id, dynamicOptions);
          }
          setHasDynamicColors(true);
        } else {
          setBackgroundOptions([plainWhiteBackground]);
          if (selectedBackgroundId !== "white") {
            handleBackgroundSelect("white", [plainWhiteBackground]);
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

  useEffect(() => {
    if (!selectedBackground?.accentColor) return;
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
      "selectedBackgroundAccentColor",
      selectedBackground.accentColor,
    );
  }, [selectedBackground]);

  return {
    backgroundOptions,
    selectedBackgroundId,
    setSelectedBackgroundId: handleBackgroundSelect,
    selectedBackground,
    hasDynamicColors,
    taskBadgeRef,
  };
}
