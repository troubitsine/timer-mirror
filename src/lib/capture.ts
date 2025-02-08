export async function captureScreenshot(): Promise<string> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      preferCurrentTab: true,
    });
    const video = document.createElement("video");
    video.srcObject = stream;

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play();
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0);
        stream.getTracks().forEach((track) => track.stop());
        resolve(canvas.toDataURL("image/jpeg"));
      };
      video.onerror = reject;
    });
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    return "";
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
