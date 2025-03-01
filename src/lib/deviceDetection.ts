/**
 * Utility functions to detect device type and capabilities
 */

/**
 * Check if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  // Check if the userAgent contains mobile-specific strings
  const userAgent =
    navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

  // Check if the device has touch capabilities
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Check screen width (typical mobile breakpoint)
  const isSmallScreen = window.innerWidth <= 768;

  return (
    mobileRegex.test(userAgent.toLowerCase()) ||
    (hasTouchScreen && isSmallScreen)
  );
}

/**
 * Check if screen capture is supported on the current device
 */
export function isScreenCaptureSupported(): boolean {
  // Most mobile browsers don't support getDisplayMedia or have limitations
  if (isMobileDevice()) {
    return false;
  }

  // Check if the browser supports getDisplayMedia
  return (
    !!navigator.mediaDevices && "getDisplayMedia" in navigator.mediaDevices
  );
}
