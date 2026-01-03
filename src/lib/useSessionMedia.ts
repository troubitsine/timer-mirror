/**
 * useSessionMedia - Shared hook for session media selection
 * Handles photo interleaving, mobile/desktop logic, and derived values
 */
import { useMemo } from "react";
import { isMobileDevice } from "./deviceDetection";

interface UseSessionMediaOptions {
  screenshots?: string[];
  webcamPhotos?: string[];
  maxCards?: number;
}

interface UseSessionMediaResult {
  allPhotos: string[];
  lastPhoto: string | null;
  numberOfCards: number;
  hasScreenshots: boolean;
  isMobile: boolean;
}

/**
 * Interleave two arrays alternately (arr1[0], arr2[0], arr1[1], arr2[1], ...)
 */
function interleaveArrays(arr1: string[], arr2: string[]): string[] {
  const result: string[] = [];
  const maxLength = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < maxLength; i++) {
    if (arr1[i]) result.push(arr1[i]);
    if (arr2[i]) result.push(arr2[i]);
  }
  return result;
}

export function useSessionMedia({
  screenshots = [],
  webcamPhotos = [],
  maxCards = 12,
}: UseSessionMediaOptions = {}): UseSessionMediaResult {
  const isMobile = isMobileDevice();

  // Filter valid photos once
  const validScreenshots = useMemo(
    () => screenshots.filter((s) => s && s.length > 0),
    [screenshots]
  );
  const validWebcamPhotos = useMemo(
    () => webcamPhotos.filter((p) => p && p.length > 0),
    [webcamPhotos]
  );

  const hasScreenshots = validScreenshots.length > 0;

  // Combine photos based on device type
  const allPhotos = useMemo(() => {
    if (isMobile || !hasScreenshots) {
      // On mobile or when no valid screenshots are available, only use webcam photos
      return [...validWebcamPhotos];
    } else {
      // For desktop with valid screenshots, interleave screenshots and webcam photos
      return interleaveArrays(validScreenshots, validWebcamPhotos);
    }
  }, [validScreenshots, validWebcamPhotos, isMobile, hasScreenshots]);

  // Get the last photo for color extraction
  const lastPhoto = useMemo(() => {
    if (isMobile || !hasScreenshots) {
      // On mobile or when no valid screenshots, use the last webcam photo
      return validWebcamPhotos.length > 0
        ? validWebcamPhotos[validWebcamPhotos.length - 1]
        : null;
    } else {
      // On desktop with valid screenshots, prefer last screenshot, fallback to webcam
      return validScreenshots.length > 0
        ? validScreenshots[validScreenshots.length - 1]
        : validWebcamPhotos.length > 0
          ? validWebcamPhotos[validWebcamPhotos.length - 1]
          : null;
    }
  }, [validScreenshots, validWebcamPhotos, isMobile, hasScreenshots]);

  const numberOfCards = Math.min(allPhotos.length, maxCards);

  return {
    allPhotos,
    lastPhoto,
    numberOfCards,
    hasScreenshots,
    isMobile,
  };
}
