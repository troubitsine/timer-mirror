console.log("⚡ CAPTURE helper loaded from", import.meta.url);

// This file is deprecated - import from mediaCapture.ts instead
// Re-export the functions from mediaCapture.ts for backward compatibility

import {
  captureScreenshot as captureScreenshotNew,
  captureWebcam as captureWebcamNew,
  initializeMediaCapture,
  scheduleCaptures as scheduleCapturesNew,
} from "./mediaCapture";

// Re-export with original names for backward compatibility
export const captureScreenshot = captureScreenshotNew;
export const captureWebcam = captureWebcamNew;
export const scheduleCaptures = scheduleCapturesNew;

// Provide a compatibility function that calls initializeMediaCapture internally
export async function initializeScreenCapture(): Promise<MediaStream | null> {
  console.warn(
    "initializeScreenCapture is deprecated, use initializeMediaCapture instead",
  );
  try {
    // Create a temporary video element to maintain API compatibility
    const tempVideo = document.createElement("video");
    const { screenStream } = await initializeMediaCapture(tempVideo);
    return screenStream;
  } catch (error) {
    console.error("Error initializing screen capture:", error);
    return null;
  }
}

// Compatibility function
export function cleanupScreenCapture() {
  console.warn(
    "cleanupScreenCapture is deprecated - cleanup is handled by mediaCapture",
  );
  // The actual cleanup is now handled by the return function from scheduleCaptures
  // This is kept for backward compatibility
}
