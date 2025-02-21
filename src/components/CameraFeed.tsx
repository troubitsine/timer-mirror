import React, { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Camera, CameraOff, Maximize2 } from "lucide-react";

interface CameraFeedProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  width?: number;
  height?: number;
  onStart?: (duration: number) => void;
  onTaskNameChange?: (name: string) => void;
  onSessionComplete?: () => void;
}

const CameraFeed = React.forwardRef<HTMLVideoElement, CameraFeedProps>(
  (
    {
      onPermissionGranted = () => {},
      onPermissionDenied = () => {},
      width = 800,
      height = 400,
      onStart = () => {},
      onTaskNameChange = () => {},
      onSessionComplete = () => {},
    },
    ref,
  ) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const videoRef =
      (ref as React.RefObject<HTMLVideoElement>) || localVideoRef;
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showPermissionDialog, setShowPermissionDialog] = useState(true);
    const [pipWindow, setPipWindow] = useState<Window | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [taskName, setTaskName] = useState("");
    const [duration, setDuration] = useState(25 * 60); // Store duration in seconds
    const timerRef = useRef<NodeJS.Timeout>();

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          onPermissionGranted();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
        onPermissionDenied();
      }
    };

    const showEndMessage = () => {
      if (pipWindow) {
        const timerDiv = pipWindow.document.querySelector(".pip-timer");
        if (timerDiv) {
          timerDiv.innerHTML = `
          <div class="pip-end-message">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <div class="pip-task-name">Session Complete 🎉</div>
          </div>
        `;
        }
      }
    };

    const enterPiP = async () => {
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
        const newPipWindow =
          await window.documentPictureInPicture.requestWindow({
            width: 400,
            height: 300,
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
            background: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            overflow: hidden;
          }
          .pip-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .pip-timer {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(2px);
          }
          .pip-task-name {
            background: rgba(0, 0, 0, 0.6);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            color: white;
          }
          .pip-timer-text {
            font-size: 2rem;
            font-weight: bold;
            color: white;
          }
          .pip-end-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .checkmark {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            stroke-width: 2;
            stroke: #fff;
            stroke-miterlimit: 10;
            animation: scale 0.3s ease-in-out;
          }
          .checkmark-circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            stroke-width: 2;
            stroke: #fff;
            fill: none;
            animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          }
          .checkmark-check {
            transform-origin: 50% 50%;
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
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

        const taskNameDiv = document.createElement("div");
        taskNameDiv.className = "pip-task-name";
        taskNameDiv.textContent = taskName;
        timerDiv.appendChild(taskNameDiv);

        const timerText = document.createElement("span");
        timerText.className = "pip-timer-text";
        timerDiv.appendChild(timerText);
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
            newPipWindow.close();
          }
        };
      } catch (err) {
        console.error("Error opening Picture-in-Picture window:", err);
        setPipWindow(null);
      }
    };

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

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, []);

    // Handle timer completion
    useEffect(() => {
      if (remainingTime === 0 && isRunning) {
        setIsRunning(false);
        showEndMessage();
        onSessionComplete();
      }
    }, [remainingTime, isRunning]);

    useEffect(() => {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasPermission(false);
        return;
      }

      // Request camera permissions
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(() => {
          setHasPermission(true);
          startCamera();
        })
        .catch(() => {
          setHasPermission(false);
        });

      // Cleanup function
      return () => {
        if (videoRef.current?.srcObject) {
          const tracks = (
            videoRef.current.srcObject as MediaStream
          ).getTracks();
          tracks.forEach((track) => track.stop());
        }
        if (pipWindow) {
          pipWindow.close();
        }
      };
    }, []);

    return (
      <Card className="w-full h-full bg-background 0 relative  border-1 border-white/8 overflow-hidden shadow-sm rounded-lg">
        {hasPermission ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-muted">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ width, height }}
            />
            <div className="absolute inset-0 flex flex-col items-center bg-black/30 backdrop-blur-[2px]">
              <div className="w-full flex flex-col items-center pt-6 mb-4">
                <div
                  className={`relative isolate ${isRunning ? "w-auto" : "w-full max-w-lg"}`}
                >
                  <div className="relative">
                    {/* Background layer to force blur isolation */}
                    <div className="absolute inset-0 bg-black/15 backdrop-blur-lg rounded-xl" />

                    <input
                      type="text"
                      value={taskName}
                      placeholder="Write down what you want to work on"
                      className={`relative bg-gray-700/30 backdrop-blur-lg text-white/90 px-6 py-3 rounded-xl text-lg text-center 
      placeholder:text-white/55 border-2 border-white/10 hover:border-white/20
      focus:border-2 focus:border-white/80 focus:ring-0 focus:outline-none 
      shadow-lg transition-all duration-200 ease-in-out z-10 ${isRunning ? "w-auto min-w-[200px]" : "w-full"}`}
                      readOnly={isRunning}
                      autoFocus
                      onChange={(e) => {
                        setTaskName(e.target.value);
                        onTaskNameChange(e.target.value);
                      }}
                    />

                    {/* Gradient overlay for border effect */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-xl blur-sm" />
                  </div>
                </div>
              </div>
              {isRunning ? (
                <div className="absolute inset-0 flex items-center justify-center w-full">
                  <div className="relative w-fit max-w-[90%] h-auto max-h-60 isolate">
                    <div className="relative">
                      {/* Background layer to force blur isolation */}
                      <div className="absolute inset-0 bg-black/15 backdrop-blur-lg rounded-xl" />

                      <div
                        className="relative w-fit bg-gray-700/30 backdrop-blur-lg text-white/90 px-6 py-4 rounded-xl text-lg
                      border-1 border-white/10 z-10 space-y-3"
                      >
                        <div className="text-3xl font-bold text-white/90 text-center">
                          {Math.floor(remainingTime / 60)}:
                          {String(Math.floor(remainingTime % 60)).padStart(
                            2,
                            "0",
                          )}
                        </div>
                      </div>

                      {/* Gradient overlay for border effect */}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-xl blur-sm" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-center w-full max-w-lg">
                  <div className="relative isolate">
                    <div className="relative">
                      {/* Background layer to force blur isolation */}
                      <div className="absolute inset-0 bg-black/15 backdrop-blur-lg rounded-xl" />

                      <div
                        className="relative w-full bg-gray-700/30 backdrop-blur-lg text-white/90 px-6 py-4 rounded-xl text-lg
                        border-1 border-white/10 z-10 space-y-3"
                      >
                        <div className="text-white/80 text-lg font-medium text-center">
                          Set your timer
                        </div>
                        <div className="w-full space-y-3">
                          <div className="flex gap-2 justify-center">
                            {[15, 30, 45, 60].map((mins) => (
                              <button
                                key={mins}
                                onClick={() => setDuration(mins * 60)}
                                className="group relative px-4 py-1.5 rounded-lg text-sm font-medium text-white/90 transition-all duration-100 ease-in-out"
                              >
                                {/* Base layer with multiple gradients - made lighter */}
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-gray-400/15 to-transparent opacity-80" />
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent" />
                                <div className="absolute inset-0 rounded-lg bg-white/10" />

                                {/* Hover state overlay - made darker */}
                                <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-colors duration-75" />

                                {/* Content */}
                                <span className="relative z-10">
                                  {mins === 60 ? "1 hr" : `${mins} min`}
                                </span>
                              </button>
                            ))}
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="7200"
                            step="1"
                            value={duration}
                            onChange={(e) =>
                              setDuration(Number(e.target.value))
                            }
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                          />
                          <div className="text-white/90 text-xs text-center">
                            {duration < 60
                              ? `${duration} seconds`
                              : `${Math.floor(duration / 60)} minutes`}
                          </div>
                        </div>
                      </div>

                      {/* Gradient overlay for border effect */}
                      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 via-transparent to-white/10 rounded-xl blur-sm" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="relative w-full isolate">
                      {/* Background layers for better blur and gradient effects */}
                      <div className="absolute inset-0 rounded-full">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-gray-400/15 to-transparent opacity-80" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/5 via-transparent to-white/5" />
                      </div>

                      <button
                        onClick={() => {
                          setIsRunning(true);
                          setRemainingTime(duration);
                          onStart(duration / 60);

                          const startTime = Date.now();
                          timerRef.current = setInterval(() => {
                            const elapsedSeconds = Math.floor(
                              (Date.now() - startTime) / 1000,
                            );
                            const newRemainingTime = Math.max(
                              0,
                              duration - elapsedSeconds,
                            );

                            setRemainingTime(newRemainingTime);

                            if (newRemainingTime <= 0) {
                              clearInterval(timerRef.current);
                            }
                          }, 1000);
                        }}
                        className="relative w-full bg-gray-900/70 backdrop-blur-lg text-white px-6 py-3 rounded-full text-lg text-center 
      border border-white/10 hover:border-white/20 
      focus:border-2 focus:border-white/80 focus:ring-0 focus:outline-none 
      shadow-lg transition-all duration-150 ease-in-out group"
                      >
                        {/* Hover overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/0 shadow-md group-hover:bg-black/30 transition-colors duration-300 ease-in-out" />

                        {/* Content */}
                        <span className="relative z-10">
                          Start focus session
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm flex items-center gap-2 rounded-full"
                onClick={enterPiP}
              >
                <Maximize2 className="h-4 w-4" />
                Open floating window
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full space-y-4 bg-muted rounded-lg">
            <CameraOff className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Camera access is required</p>
            <Button onClick={startCamera}>Enable Camera</Button>
          </div>
        )}

        <AlertDialog open={!hasPermission && showPermissionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Camera Permission Required</AlertDialogTitle>
              <AlertDialogDescription>
                This app needs access to your camera to create your work session
                montage. Please enable camera access to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowPermissionDialog(false)}>
                Understood
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  },
);

export default CameraFeed;
