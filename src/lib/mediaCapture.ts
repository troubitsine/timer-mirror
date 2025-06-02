console.log("⚡ CAPTURE helper loaded from", import.meta.url);

import { isMobileDevice, isScreenCaptureSupported } from "./deviceDetection";

let screenVideo: HTMLVideoElement | null = null;
let webcamVideo: HTMLVideoElement | null = null;

export async function initializeMediaCapture(
  webcamElement: HTMLVideoElement,
): Promise<{
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
}> {
  console.log("🔍 initializeMediaCapture called with webcamElement:", {
    readyState: webcamElement?.readyState,
    videoWidth: webcamElement?.videoWidth,
    videoHeight: webcamElement?.videoHeight,
    srcObject: !!webcamElement?.srcObject,
  });

  try {
    // Get webcam stream from the existing video element
    const webcamStream = webcamElement.srcObject as MediaStream;
    webcamVideo = webcamElement;
    console.log("🎥 Webcam stream obtained:", {
      active: webcamStream?.active,
      tracks: webcamStream?.getTracks().length,
    });

    // Only attempt to capture screen on desktop devices
    if (isScreenCaptureSupported()) {
      console.log(
        "🖥️ Screen capture is supported, attempting to get display media",
      );
      try {
        // Attempt to get display media with detailed constraints first
        let screenStream: MediaStream | null = null;
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: "monitor",
              // @ts-ignore - logicalSurface is not yet in TypeScript's lib definitions but is supported in modern browsers
              logicalSurface: true,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            audio: false,
          });
        } catch (detailedErr) {
          console.warn(
            "⚠️ getDisplayMedia with detailed constraints failed:",
            detailedErr,
          );
          try {
            // Fallback: try again with minimal constraints
            screenStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: false,
            });
            console.log(
              "✅ Fallback getDisplayMedia succeeded with minimal constraints",
            );
          } catch (minimalErr) {
            console.error(
              "❌ Fallback getDisplayMedia also failed:",
              minimalErr,
            );
            throw minimalErr; // propagate to outer catch
          }
        }
        // At this point, screenStream is guaranteed to be non-null

        console.log("🖥️ Screen stream obtained:", {
          active: screenStream?.active,
          tracks: screenStream?.getTracks().length,
          trackSettings: screenStream?.getVideoTracks()[0]?.getSettings(),
        });

        // Set up hidden screen video element
        screenVideo = document.createElement("video");
        screenVideo.style.cssText =
          "position:fixed;top:0;left:0;width:320px;height:240px;" +
          "opacity:0.01;pointer-events:none;z-index:-1;";
        screenVideo.srcObject = screenStream;
        screenVideo.muted = true;
        screenVideo.autoplay = true;
        screenVideo.playsInline = true;
        document.body.appendChild(screenVideo);

        console.log("🖥️ Screen video element created and appended to body");

        // Add reference to window for debugging
        (window as any).__screenVideo = screenVideo;

        // Wait for video to be ready
        const videoReady = await new Promise<boolean>((resolve) => {
          screenVideo.onloadedmetadata = () => {
            console.log("🖥️ Screen video metadata loaded");
            screenVideo
              .play()
              .then(() => {
                console.log("🖥️ Screen video playback started");
                // Wait for the decoder's first real frame before resolving
                if (screenVideo.requestVideoFrameCallback) {
                  screenVideo.requestVideoFrameCallback(() => {
                    console.log("✅ First frame arrived");
                    resolve(true);
                  });
                } else {
                  // Fallback if requestVideoFrameCallback is not supported
                  console.log(
                    "⚠️ requestVideoFrameCallback not supported, resolving immediately",
                  );
                  resolve(true);
                }
              })
              .catch((e) => {
                console.error("❌ Error playing screen video:", e);
                resolve(false);
              });
          };

          // Add timeout in case metadata never loads
          setTimeout(() => {
            console.warn(
              "⚠️ Screen video metadata load timeout, resolving anyway",
            );
            resolve(false);
          }, 5000);
        });

        if (!videoReady) {
          console.warn("⚠️ Screen video may not be fully ready");
        }

        // Force a frame to be rendered
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
            console.log("✅ Initial frame rendered successfully");

            // Test if we can get a data URL
            try {
              const testDataUrl = canvas.toDataURL("image/jpeg", 0.9);
              console.log(
                "✅ Test data URL generated successfully, length:",
                testDataUrl.length,
              );
            } catch (dataUrlError) {
              console.error("❌ Error generating test data URL:", dataUrlError);
            }
          }
        } catch (e) {
          console.warn("⚠️ Could not render initial frame:", e);
        }

        // Verify that the screen video is ready for capture
        const isReady =
          screenVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          screenVideo.videoWidth > 0 &&
          screenVideo.videoHeight > 0;

        console.log("🖥️ Screen video ready check:", {
          isReady,
          readyState: screenVideo.readyState,
          videoWidth: screenVideo.videoWidth,
          videoHeight: screenVideo.videoHeight,
        });

        // Add event listener for track ended
        screenStream.getVideoTracks()[0].onended = () => {
          console.log("🖥️ Screen capture track ended");
        };

        return { screenStream, webcamStream };
      } catch (screenError) {
        console.error("❌ Error initializing screen capture:", screenError);
        return { screenStream: null, webcamStream };
      }
    } else {
      // On mobile, we only use webcam
      console.log(
        "📱 Screen capture not supported on this device, using webcam only",
      );
      return { screenStream: null, webcamStream };
    }
  } catch (error) {
    console.error("❌ Error initializing media capture:", error);
    return { screenStream: null, webcamStream: null };
  }
}

// Expose screenVideo for debugging
declare global {
  interface Window {
    __screenVideo?: HTMLVideoElement;
  }
}

export function captureScreenshot(): Promise<string> {
  console.log("[CAPTURE] Using NEW helper");
  console.log("[A] capture helper from", import.meta.url);
  return new Promise(async (resolve, reject) => {
    if (!screenVideo) {
      // If screen capture is not available, return an empty string
      // This allows the app to continue with just webcam photos on mobile
      console.log("No screen video element available for screenshot");
      resolve("");
      return;
    }

    try {
      // Wait until at least one frame is available
      if (
        screenVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !screenVideo.videoWidth
      ) {
        await new Promise<void>((resolve) => {
          const checkFrame = () => {
            if (
              screenVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              screenVideo.videoWidth > 0
            ) {
              resolve();
            } else {
              screenVideo.onloadeddata = () => resolve();
            }
          };
          checkFrame();
        }).catch(() => console.log("Waiting for video frame timed out"));
      }

      // Get track settings as fallback for dimensions
      const track = (screenVideo.srcObject as MediaStream)?.getVideoTracks()[0];
      const { width: trackWidth, height: trackHeight } =
        track?.getSettings() || {};

      const canvas = document.createElement("canvas");
      canvas.width = screenVideo.videoWidth || trackWidth || 1920;
      canvas.height = screenVideo.videoHeight || trackHeight || 1080;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get canvas context");
        resolve("");
        return;
      }

      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

      // Use a higher quality setting for the JPEG
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Verify that we got a valid data URL
      if (dataUrl === "data:," || dataUrl.length < 100) {
        console.error(
          "Generated empty or invalid screenshot – attempting ImageCapture fallback",
        );

        // ---------- NEW: ImageCapture fallback ----------
        try {
          const track = (
            screenVideo.srcObject as MediaStream
          )?.getVideoTracks?.()[0];
          if (track && "ImageCapture" in window) {
            // @ts-ignore – ImageCapture is not yet in the TS lib DOM types everywhere
            const imageCapture = new (window as any).ImageCapture(track);
            // grabFrame returns a VideoFrame (new spec) or ImageBitmap (old)
            const bitmap: any = await imageCapture.grabFrame();

            const fallbackCanvas = document.createElement("canvas");
            // @ts-ignore width/height differ for VideoFrame vs ImageBitmap but both expose them
            fallbackCanvas.width =
              bitmap.width || (bitmap as any).displayWidth || 1920;
            // @ts-ignore
            fallbackCanvas.height =
              bitmap.height || (bitmap as any).displayHeight || 1080;
            const fCtx = fallbackCanvas.getContext("2d");
            if (fCtx) {
              // drawBitmap is available for VideoFrame, otherwise we fall back to drawImage
              if ("drawBitmap" in fCtx) {
                // @ts-ignore – drawBitmap is experimental
                await (fCtx as any).drawBitmap(bitmap, 0, 0);
              } else {
                // For ImageBitmap we can use drawImage directly
                // @ts-ignore
                fCtx.drawImage(
                  bitmap,
                  0,
                  0,
                  fallbackCanvas.width,
                  fallbackCanvas.height,
                );
              }
              const fallbackDataUrl = fallbackCanvas.toDataURL(
                "image/jpeg",
                0.9,
              );
              if (fallbackDataUrl && fallbackDataUrl.length > 100) {
                console.log(
                  "✅ ImageCapture fallback successful, length:",
                  fallbackDataUrl.length,
                );
                resolve(fallbackDataUrl);
                return;
              }
            }
          }
        } catch (icErr) {
          console.error("❌ ImageCapture fallback failed:", icErr);
        }
        // ---------- END NEW ----------

        resolve("");
        return;
      }

      console.log("[A] len", dataUrl.length, dataUrl.slice(0, 40));
      resolve(dataUrl);
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      resolve(""); // Return empty string on error to continue with webcam only
    }
  });
}

export function captureWebcam(
  videoElement?: HTMLVideoElement | null,
): Promise<string> {
  console.log("📸 captureWebcam called");
  return new Promise((resolve, reject) => {
    // Use provided video element if available, otherwise use the global webcamVideo
    const videoToCapture = videoElement || webcamVideo;

    if (!videoToCapture) {
      console.error("❌ Webcam capture not initialized - no video element");
      reject("Webcam capture not initialized");
      return;
    }

    console.log("🎥 Webcam video status:", {
      readyState: videoToCapture.readyState,
      videoWidth: videoToCapture.videoWidth,
      videoHeight: videoToCapture.videoHeight,
      srcObject: !!videoToCapture.srcObject,
      currentTime: videoToCapture.currentTime,
      paused: videoToCapture.paused,
    });

    try {
      // Check if video dimensions are valid
      if (!videoToCapture.videoWidth || !videoToCapture.videoHeight) {
        console.error("❌ Invalid video dimensions for webcam capture");
        reject("Invalid video dimensions");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoToCapture.videoWidth;
      canvas.height = videoToCapture.videoHeight;
      console.log("🖼️ Webcam canvas dimensions:", {
        width: canvas.width,
        height: canvas.height,
      });

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("❌ Could not get canvas context for webcam capture");
        reject("Could not get canvas context");
        return;
      }

      try {
        ctx.drawImage(videoToCapture, 0, 0, canvas.width, canvas.height);
        console.log("✅ Successfully drew webcam video to canvas");
      } catch (drawError) {
        console.error("❌ Error drawing webcam video to canvas:", drawError);
        reject(drawError);
        return;
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Verify that we got a valid data URL
      if (dataUrl === "data:," || dataUrl.length < 100) {
        console.error("❌ Generated empty or invalid webcam photo");
        reject("Invalid webcam photo");
        return;
      }

      console.log(
        "📸 Webcam photo captured successfully, length:",
        dataUrl.length,
      );
      resolve(dataUrl);
    } catch (error) {
      console.error("❌ Error capturing webcam:", error);
      reject(error);
    }
  });
}

export function scheduleCaptures(
  sessionDurationSec: number,
  onCapture: (screenshot: string, webcamPhoto: string) => void,
) {
  const MIN_CAPTURES = 4;
  const MAX_CAPTURES_PER_HOUR = 12;

  // Compute preliminary count of capture pairs based on session duration
  const prelimCount = Math.floor(
    (sessionDurationSec / 3600) * MAX_CAPTURES_PER_HOUR,
  );
  const totalCaptures = Math.max(MIN_CAPTURES, prelimCount);

  const intervalSec = sessionDurationSec / totalCaptures;

  console.log(
    `Session Duration: ${sessionDurationSec}s, Total Capture Pairs: ${totalCaptures}, Interval: ${intervalSec}s`,
  );

  const captureTimeouts: NodeJS.Timeout[] = [];

  for (let i = 1; i <= totalCaptures; i++) {
    const timeout = setTimeout(
      async () => {
        console.log("[U] timeout fired", i);
        try {
          let webcamPhoto = "";
          try {
            webcamPhoto = await captureWebcam();
          } catch (webcamError) {
            console.error("Error capturing webcam:", webcamError);
          }

          let screenshot = "";
          try {
            screenshot = await captureScreenshot();
          } catch (screenshotError) {
            console.error("Error capturing screenshot:", screenshotError);
          }

          onCapture(screenshot, webcamPhoto);
        } catch (error) {
          console.error("Error during capture:", error);
        }
      },
      i * intervalSec * 1000,
    );

    captureTimeouts.push(timeout);
  }

  return () => {
    captureTimeouts.forEach(clearTimeout);
    if (screenVideo) {
      const stream = screenVideo.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      screenVideo.remove();
      screenVideo = null;
    }
  };
}
