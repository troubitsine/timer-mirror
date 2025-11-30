import { useState, useEffect, useRef } from "react";
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

  // Plain white background for when no dynamic colors are available
  const plainWhiteBackground: BackgroundOption = {
    id: "white",
    name: "White",
    className: "bg-white",
    accentColor: "#ffffff",
  };

  // State for dynamic background options
  const [backgroundOptions, setBackgroundOptions] = useState<
    BackgroundOption[]
  >([plainWhiteBackground]);

  // Track if dynamic colors were successfully extracted
  const [hasDynamicColors, setHasDynamicColors] = useState(false);

  // State for selected background - use initialSelectedId if provided
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(
    initialSelectedId || "white",
  );

  // Get the selected background option
  const selectedBackground = backgroundOptions.find(
    (option) => option.id === selectedBackgroundId,
  );

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
            accentColor: palette.Vibrant.hex,
          });
        } else {
          // For desktop, use the gradient as before
          dynamicOptions.push({
            id: "dynamicGradient",
            name: "Dynamic Gradient",
            style: {
              /* three radial blobs, no blend‑mode */
              backgroundImage: `
        radial-gradient(circle at 15%   100%, ${palette.Vibrant.hex}cc       0%, transparent 70%),
        radial-gradient(circle at 80%  60%, ${palette.LightVibrant.hex}66  0%, transparent 95%),
        radial-gradient(circle at 100%   0%, ${palette.Vibrant.hex}       0%, transparent 70%)
      `,
              backgroundColor: palette.LightVibrant.hex, // solid fallback
            },
            accentColor: palette.Vibrant.hex,
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
        }
      }

      // Add solid color options
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

      // If we have dynamic options, use them; otherwise, keep the plain white background
      if (dynamicOptions.length > 0) {
        setBackgroundOptions(dynamicOptions);
        // Only set the first dynamic option as selected if no background is currently selected
        // or if the current selection isn't in the new options
        const currentIdExists = dynamicOptions.some(
          (option) => option.id === selectedBackgroundId,
        );
        if (!currentIdExists) {
          handleBackgroundSelect(dynamicOptions[0].id);
        }
        // Indicate that we have dynamic colors
        setHasDynamicColors(true);
      } else {
        // Reset to plain white background if no dynamic colors could be extracted
        setBackgroundOptions([plainWhiteBackground]);
        if (selectedBackgroundId !== "white") {
          handleBackgroundSelect("white");
        }
        setHasDynamicColors(false);
      }
    } catch (error) {
      console.error("Error extracting colors from image:", error);
      // Keep using default options if there's an error
    }
  };

  // Extract colors from the image when available
  useEffect(() => {
    if (imageSrc) {
      extractColorsFromImage(imageSrc);
    }
  }, [imageSrc]); // Note: selectedBackgroundId is intentionally not in the dependency array

  // Handle background selection with callback if provided
  const handleBackgroundSelect = (id: string) => {
    setSelectedBackgroundId(id);
    // Also save to sessionStorage for persistence
    sessionStorage.setItem("selectedBackgroundId", id);
    if (onSelect) {
      onSelect(id);
    }
  };

  return {
    backgroundOptions,
    selectedBackgroundId,
    setSelectedBackgroundId: handleBackgroundSelect,
    selectedBackground,
    hasDynamicColors,
    taskBadgeRef,
  };
}
