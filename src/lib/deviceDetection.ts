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

  const result = mobileRegex.test(userAgent.toLowerCase());

  // Only use the user agent to determine if it's a mobile device
  // This prevents misidentifying desktop devices with touch screens and small windows
  return result;
}

/**
 * Check if screen capture is supported on the current device
 */
export function isScreenCaptureSupported(): boolean {
  // Check if the browser supports getDisplayMedia - this is the only real requirement
  const hasMediaDevices = !!navigator.mediaDevices;
  const hasGetDisplayMedia =
    hasMediaDevices && "getDisplayMedia" in navigator.mediaDevices;

  // Only check for mobile if we have the basic capability
  const isMobile = hasGetDisplayMedia ? isMobileDevice() : true;

  // Most mobile browsers don't support getDisplayMedia properly
  const result = hasGetDisplayMedia && !isMobile;

  return result;
}
