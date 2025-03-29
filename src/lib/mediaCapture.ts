import { isMobileDevice, isScreenCaptureSupported } from "./deviceDetection";

let screenVideo: HTMLVideoElement | null = null;
let webcamVideo: HTMLVideoElement | null = null;

export async function initializeMediaCapture(
  webcamElement: HTMLVideoElement,
): Promise<{
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
}> {
  try {
    // Get webcam stream from the existing video element
    const webcamStream = webcamElement.srcObject as MediaStream;
    webcamVideo = webcamElement;

    // Only attempt to capture screen on desktop devices
    if (isScreenCaptureSupported()) {
      try {
        // Get screen stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            logicalSurface: true,
          },
        });

        // Set up hidden screen video element
        screenVideo = document.createElement("video");
        screenVideo.style.display = "none";
        screenVideo.srcObject = screenStream;
        document.body.appendChild(screenVideo);
        await screenVideo.play();

        return { screenStream, webcamStream };
      } catch (screenError) {
        console.error("Error initializing screen capture:", screenError);
        return { screenStream: null, webcamStream };
      }
    } else {
      // On mobile, we only use webcam
      console.log(
        "Screen capture not supported on this device, using webcam only",
      );
      return { screenStream: null, webcamStream };
    }
  } catch (error) {
    console.error("Error initializing media capture:", error);
    return { screenStream: null, webcamStream: null };
  }
}

export function captureScreenshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!screenVideo) {
      // If screen capture is not available, return an empty string
      // This allows the app to continue with just webcam photos on mobile
      resolve("");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = screenVideo.videoWidth;
      canvas.height = screenVideo.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(screenVideo, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      resolve(""); // Return empty string on error to continue with webcam only
    }
  });
}

export function captureWebcam(
  videoElement?: HTMLVideoElement | null,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use provided video element if available, otherwise use the global webcamVideo
    const videoToCapture = videoElement || webcamVideo;

    if (!videoToCapture) {
      reject("Webcam capture not initialized");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoToCapture.videoWidth;
      canvas.height = videoToCapture.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoToCapture, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    } catch (error) {
      console.error("Error capturing webcam:", error);
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
  const isMobile = isMobileDevice();

  for (let i = 1; i <= totalCaptures; i++) {
    const timeout = setTimeout(
      async () => {
        try {
          if (isMobile) {
            // On mobile, only capture webcam photos
            const webcamPhoto = await captureWebcam();
            onCapture("", webcamPhoto); // Empty string for screenshot
          } else {
            // On desktop, capture both
            const [screenshot, webcamPhoto] = await Promise.all([
              captureScreenshot(),
              captureWebcam(),
            ]);
            onCapture(screenshot, webcamPhoto);
          }
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
