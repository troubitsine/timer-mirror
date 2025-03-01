import { useState, useEffect } from "react";

interface PictureInPictureOptions {
  width?: number;
  height?: number;
}

interface UsePictureInPictureProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  taskName: string;
  remainingTime: number;
  onSessionComplete?: () => void;
}

export function usePictureInPicture({
  videoRef,
  taskName,
  remainingTime,
  onSessionComplete = () => {},
}: UsePictureInPictureProps) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Update PiP window timer
  useEffect(() => {
    if (pipWindow) {
      const timerText = pipWindow.document.querySelector(".pip-timer-text");
      if (timerText) {
        timerText.textContent = `${Math.floor(remainingTime / 60)}:${String(
          Math.floor(remainingTime % 60),
        ).padStart(2, "0")}`;
      }
    }
  }, [remainingTime, pipWindow]);

  // Keep PiP window open even when component unmounts
  // We'll let the user close it manually
  useEffect(() => {
    return () => {
      // We intentionally don't close the PiP window here
      // so it remains visible with the completion animation
      // even after navigating to the session montage page
    };
  }, [pipWindow]);

  const showEndMessage = () => {
    if (pipWindow) {
      const timerDiv = pipWindow.document.querySelector(".pip-timer");
      if (timerDiv) {
        // Clear any existing content
        timerDiv.innerHTML = "";

        // Create end message container
        const endMessageContainer = document.createElement("div");
        endMessageContainer.className = "pip-end-message";

        // Create SVG checkmark
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "checkmark");
        svg.setAttribute("viewBox", "0 0 52 52");

        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("class", "checkmark-circle");
        circle.setAttribute("cx", "26");
        circle.setAttribute("cy", "26");
        circle.setAttribute("r", "25");
        circle.setAttribute("fill", "none");

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("class", "checkmark-check");
        path.setAttribute("fill", "none");
        path.setAttribute("d", "M14.1 27.2l7.1 7.2 16.7-16.8");

        svg.appendChild(circle);
        svg.appendChild(path);
        endMessageContainer.appendChild(svg);

        // Create completion text
        const completionText = document.createElement("div");
        completionText.className = "pip-timer-text";
        completionText.textContent = "Session Complete 🎉";
        endMessageContainer.appendChild(completionText);

        // Add to timer div
        timerDiv.appendChild(endMessageContainer);
      }
    }
  };

  const enterPiP = async (options: PictureInPictureOptions = {}) => {
    if (!("documentPictureInPicture" in window)) {
      console.error("Picture-in-Picture API not supported");
      return;
    }

    try {
      // Close existing PiP window if it exists
      if (pipWindow) {
        pipWindow.close();
      }

      // @ts-ignore - TypeScript doesn't know about Document Picture-in-Picture API yet
      const newPipWindow = await window.documentPictureInPicture.requestWindow({
        width: options.width || 400,
        height: options.height || 300,
      });

      setPipWindow(newPipWindow);

      // Create styles for the PiP window
      const style = document.createElement("style");
      style.textContent = `
        body { 
          margin: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: system-ui;
        }
        .pip-container {
          width: 100%;
          height: 100%;
          position: relative;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: none;
        }
        .pip-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: rotateY(180deg);
        }
        .pip-timer {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          background: rgba(0, 0, 0, 0.2);
        }
        .pip-task-name-container {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 12px 16px 8px;
          box-sizing: border-box;
        }
        .pip-task-name {
          background: linear-gradient(to bottom, rgba(70, 70, 70, 0.5), rgba(40, 40, 40, 0.5));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 8px 16px 9px 16px;
          border-radius: 10px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-width: calc(100% - 32px);
          margin: 0 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pip-task-name::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          pointer-events: none;
        }
        .pip-timer-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .pip-timer-text {
          background: linear-gradient(to bottom, rgba(70, 70, 70, 0.5), rgba(40, 40, 40, 0.5));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 24px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.85);
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .pip-timer-text::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          pointer-events: none;
        }
        .pip-end-message {
          display: flex;
           font-size: 16px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .checkmark {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          stroke-width: 2;
          stroke: #fff;
          stroke-miterlimit: 10;
          animation: scale 0.5s ease-in-out;
          margin-bottom: 8px;
        }
        .checkmark-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 2;
          stroke: #fff;
          fill: none;
          animation: stroke 0.7s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark-check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
      `;
      newPipWindow.document.head.appendChild(style);

      const container = document.createElement("div");
      container.className = "pip-container";

      const video = document.createElement("video");
      video.className = "pip-video";
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      if (videoRef.current?.srcObject) {
        video.srcObject = videoRef.current.srcObject;
      }
      container.appendChild(video);

      // Timer container
      const timerDiv = document.createElement("div");
      timerDiv.className = "pip-timer";

      // Task name container at the top
      const taskNameContainer = document.createElement("div");
      taskNameContainer.className = "pip-task-name-container";

      const taskNameDiv = document.createElement("div");
      taskNameDiv.className = "pip-task-name";
      taskNameDiv.textContent = taskName;
      taskNameContainer.appendChild(taskNameDiv);
      timerDiv.appendChild(taskNameContainer);

      // Timer text in the center
      const timerContainer = document.createElement("div");
      timerContainer.className = "pip-timer-container";

      const timerText = document.createElement("div");
      timerText.className = "pip-timer-text";
      timerContainer.appendChild(timerText);
      timerDiv.appendChild(timerContainer);

      container.appendChild(timerDiv);

      newPipWindow.document.body.appendChild(container);

      // Handle window closing
      const handleUnload = () => {
        setPipWindow(null);
      };

      newPipWindow.addEventListener("unload", handleUnload);
      newPipWindow.addEventListener("beforeunload", handleUnload);

      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden && newPipWindow) {
          video.srcObject = videoRef.current?.srcObject || null;
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Cleanup when component unmounts
      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        if (newPipWindow) {
          newPipWindow.removeEventListener("unload", handleUnload);
          newPipWindow.removeEventListener("beforeunload", handleUnload);
          // We intentionally don't close the PiP window here
          // so it remains visible with the completion animation
        }
      };
    } catch (err) {
      console.error("Error opening Picture-in-Picture window:", err);
      setPipWindow(null);
    }
  };

  return {
    pipWindow,
    enterPiP,
    showEndMessage,
  };
}
