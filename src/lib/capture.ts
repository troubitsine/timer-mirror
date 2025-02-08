let screenVideo: HTMLVideoElement | null = null;

export async function initializeScreenCapture(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "monitor",
        logicalSurface: true,
      },
    });

    screenVideo = document.createElement("video");
    screenVideo.style.display = "none";
    screenVideo.srcObject = stream;
    document.body.appendChild(screenVideo);

    await screenVideo.play();
    return stream;
  } catch (error) {
    console.error("Error initializing screen capture:", error);
    return null;
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

export function cleanupScreenCapture() {
  if (screenVideo) {
    const stream = screenVideo.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    screenVideo.remove();
    screenVideo = null;
  }
}

export async function captureWebcam(
  videoElement: HTMLVideoElement,
): Promise<string> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoElement, 0, 0);
    return canvas.toDataURL("image/jpeg");
  } catch (error) {
    console.error("Error capturing webcam:", error);
    return "";
  }
}
