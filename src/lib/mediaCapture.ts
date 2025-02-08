let screenVideo: HTMLVideoElement | null = null;
let webcamVideo: HTMLVideoElement | null = null;

export async function initializeMediaCapture(
  webcamElement: HTMLVideoElement,
): Promise<{
  screenStream: MediaStream | null;
  webcamStream: MediaStream | null;
}> {
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

    // Get webcam stream from the existing video element
    const webcamStream = webcamElement.srcObject as MediaStream;
    webcamVideo = webcamElement;

    return { screenStream, webcamStream };
  } catch (error) {
    console.error("Error initializing media capture:", error);
    return { screenStream: null, webcamStream: null };
  }
}

export function captureScreenshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!screenVideo) {
      reject("Screen capture not initialized");
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
      reject(error);
    }
  });
}

export function captureWebcam(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!webcamVideo) {
      reject("Webcam capture not initialized");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = webcamVideo.videoWidth;
      canvas.height = webcamVideo.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(webcamVideo, 0, 0);
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

  for (let i = 1; i <= totalCaptures; i++) {
    const timeout = setTimeout(
      async () => {
        try {
          const [screenshot, webcamPhoto] = await Promise.all([
            captureScreenshot(),
            captureWebcam(),
          ]);
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
