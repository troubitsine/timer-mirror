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

type PictureInPictureVariant = "default" | "compactBlur";

const PIP_VARIANT_STORAGE_KEY = "timer-mirror:pip-variant";
const DEFAULT_PIP_SIZE = { width: 400, height: 300 };
const COMPACT_PIP_SIZE = { width: 300, height: 100 };

const getStoredVariant = (): PictureInPictureVariant => {
  if (typeof window === "undefined") {
    return "default";
  }

  try {
    const storedVariant = window.localStorage.getItem(
      PIP_VARIANT_STORAGE_KEY,
    );
    return storedVariant === "compactBlur" ? "compactBlur" : "default";
  } catch {
    return "default";
  }
};

const persistVariant = (variant: PictureInPictureVariant) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PIP_VARIANT_STORAGE_KEY, variant);
  } catch {
    // Ignore storage access errors.
  }
};

const getVariantSize = (variant: PictureInPictureVariant) =>
  variant === "compactBlur" ? COMPACT_PIP_SIZE : DEFAULT_PIP_SIZE;

export function usePictureInPicture({
  videoRef,
  taskName,
  remainingTime,
  onSessionComplete: _onSessionComplete = () => {},
}: UsePictureInPictureProps) {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  // Update PiP window timer
  useEffect(() => {
    if (pipWindow) {
      const timerText =
        pipWindow.document.querySelector<HTMLElement>("[data-pip-timer]");
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
      // Hide the countdown timer
      const timerContainers =
        pipWindow.document.querySelectorAll<HTMLElement>(
          "[data-pip-timer-container]",
        );
      timerContainers.forEach((container) => {
        container.style.display = "none";
      });

      // Show the end message in the center container
      const centerContainer =
        pipWindow.document.querySelector<HTMLElement>(".pip-center-container");
      if (centerContainer) {
        // Create end message container
        const endMessageContainer = document.createElement("div");
        endMessageContainer.className = "pip-end-message";

        // Create completion text (without the checkmark)
        const completionText = document.createElement("div");
        completionText.className = "pip-complete-text";
        completionText.textContent = "Session Complete 🎉";
        endMessageContainer.appendChild(completionText);

        // Add to center container
        centerContainer.innerHTML = "";
        centerContainer.appendChild(endMessageContainer);
        centerContainer.style.display = "flex";
      }
    }
  };

  const enterPiP = async (options: PictureInPictureOptions = {}) => {
    if (!("documentPictureInPicture" in window)) {
      console.error("Picture-in-Picture API not supported");
      return;
    }

    try {
      const initialVariant = getStoredVariant();
      const initialSize = getVariantSize(initialVariant);

      // Close existing PiP window if it exists
      if (pipWindow) {
        pipWindow.close();
      }

      // @ts-expect-error documentPictureInPicture is experimental and not yet in lib DOM types
      const newPipWindow = await window.documentPictureInPicture.requestWindow({
        width: options.width ?? initialSize.width,
        height: options.height ?? initialSize.height,
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
          border-radius: 0px;
          overflow: hidden;
          box-shadow: none;
        }
        .pip-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: rotateY(180deg);
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-video {
          filter: blur(8px);
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-timer {
          background: none;
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
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 8px 8px;
          box-sizing: border-box;
          position: relative;
        }
        .pip-task-name {
          background: linear-gradient(to bottom, rgba(70, 70, 70, 0.5), rgba(40, 40, 40, 0.5));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 8px 16px 9px 16px;
          border-radius: 10px;
          font: inherit;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          width: calc(100% - 8px);
          flex: 1 1 auto;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
        }
        .pip-task-name::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          pointer-events: none;
        }
        .pip-header-time {
          width: 70px;
          height: 35px;
          display: none;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }
        .pip-variant-toggle {
          border: none;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 4px 9px;
          border-radius: 100px;
          font: inherit;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: -0.03em;
          color: rgba(0, 0, 0, 0.75);
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .pip-variant-toggle::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.2));
          border-radius: 100px;
          pointer-events: none;
        }
        .pip-variant-toggle::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          pointer-events: none;
        }
        .pip-center-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: none;
          background: none;
          padding: 0;
          border-radius: 0;
          justify-content: center;
          align-items: center;
        }
        .pip-countdown-container {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 52px;
          height: 22px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .pip-countdown-text {
          background: linear-gradient(to bottom, rgba(70, 70, 70, 0.5), rgba(40, 40, 40, 0.5));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .pip-countdown-text::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          pointer-events: none;
        }
        .pip-complete-text {
          background: linear-gradient(to bottom, rgba(70, 70, 70, 0.5), rgba(40, 40, 40, 0.5));backdrop-filter: blur(8px);-webkit-backdrop-filter: blur(8px);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 20px; /* Reduced from 24px */font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);white-space: nowrap; /* Force text to stay on one line */
          max-width: 100%; /* Ensure it doesn't exceed the container width */
          }
        .pip-complete-text::after {
          content: none;
        }
        .pip-countdown-container {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 52px;
          height: 22px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .pip-countdown-text {
          background: linear-gradient(to bottom, rgba(70, 70, 70, 0.5), rgba(40, 40, 40, 0.5));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          position: relative;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .pip-countdown-text::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          pointer-events: none;
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-task-name-container {
          justify-content: flex-start;
          align-items: center;
          gap: 0;
          padding: 0 8px 0 0;
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(70, 70, 70, 0.5), rgba(40, 40, 40, 0.5));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-task-name {
          width: auto;
          padding: 0;
          text-align: left;
          background: none;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-task-name::after {
          content: none;
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-header-time {
          display: flex;
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-countdown-text {
          background: none;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-countdown-text::after {
          content: none;
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-countdown-container {
          display: none;
        }
        .pip-container[data-pip-variant="compactBlur"] .pip-variant-toggle {
          position: static;
          transform: none;
          margin-left: auto;
        }
        .pip-end-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  background: none;
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

      const headerTime = document.createElement("div");
      headerTime.className = "pip-header-time";
      headerTime.setAttribute("data-pip-timer-container", "true");

      const countdownText = document.createElement("div");
      countdownText.className = "pip-countdown-text";
      countdownText.setAttribute("data-pip-timer", "true");

      const taskNameDiv = document.createElement("div");
      taskNameDiv.className = "pip-task-name";
      taskNameDiv.textContent = taskName;

      const toggleButton = document.createElement("button");
      toggleButton.className = "pip-variant-toggle";
      toggleButton.type = "button";
      toggleButton.setAttribute("aria-label", "Toggle PiP layout");

      taskNameContainer.appendChild(headerTime);
      taskNameContainer.appendChild(taskNameDiv);
      taskNameContainer.appendChild(toggleButton);
      timerDiv.appendChild(taskNameContainer);

      // Center container for end message
      const centerContainer = document.createElement("div");
      centerContainer.className = "pip-center-container";
      timerDiv.appendChild(centerContainer);

      // Countdown timer at bottom left
      const countdownContainer = document.createElement("div");
      countdownContainer.className = "pip-countdown-container";
      countdownContainer.setAttribute("data-pip-timer-container", "true");
      timerDiv.appendChild(countdownContainer);

      let currentVariant = initialVariant;

      const updateToggleLabel = (variant: PictureInPictureVariant) => {
        toggleButton.textContent =
          variant === "compactBlur" ? "Default" : "Compact";
        toggleButton.setAttribute(
          "aria-pressed",
          variant === "compactBlur" ? "true" : "false",
        );
      };

      const applyVariant = (variant: PictureInPictureVariant) => {
        currentVariant = variant;
        container.dataset.pipVariant = variant;

        if (variant === "compactBlur") {
          if (countdownText.parentElement !== headerTime) {
            headerTime.appendChild(countdownText);
          }
        } else if (countdownText.parentElement !== countdownContainer) {
          countdownContainer.appendChild(countdownText);
        }

        updateToggleLabel(variant);
      };

      applyVariant(initialVariant);

      toggleButton.addEventListener("click", () => {
        const nextVariant =
          currentVariant === "compactBlur" ? "default" : "compactBlur";
        applyVariant(nextVariant);
        persistVariant(nextVariant);
        const nextSize = getVariantSize(nextVariant);

        try {
          if (typeof newPipWindow.resizeTo === "function") {
            newPipWindow.resizeTo(nextSize.width, nextSize.height);
          }
        } catch {
          // Ignore resize failures.
        }
      });

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
