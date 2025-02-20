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
import { CameraOff, Maximize2 } from "lucide-react";

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
    const [selectedDuration, setSelectedDuration] = useState<number | null>(
      null,
    );
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
            transform: rotateY(180deg);
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
          }
          .pip-task-name {
            background: rgb(23 23 23 / 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
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
      <Card className="w-full h-full bg-background relative border-none inner-stroke-black-10-sm overflow-hidden shadow-sm rounded-lg">
        {hasPermission ? (
          <div className="relative w-full h-full  overflow-hidden">
            {/* 1) No blur here on the camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover [transform:rotateY(180deg)]"
              style={{ width, height }}
            />

            {/* 2) UI overlay container with a single blur */}
            <div className="absolute inset-0 flex flex-col items-center bg-black/20">
              <div className="w-full flex flex-col items-center pt-6 mb-4">
                <input
                  type="text"
                  value={taskName}
                  placeholder="Write down what you want to work on"
                  className={`
                    text-white/90 
                    placeholder:text-white/55 
                    px-6 py-3 rounded-xl text-lg text-center shadow-sm
                    bg-neutral-800/40 
                     backdrop-blur-md hover:bg-neutral-800/50 focus:bg-neutral-800/50 
                     focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-white focus:ring-inset transition-colors 
                    ${isRunning ? "w-auto min-w-[200px]" : "w-full max-w-lg"}
                  `}
                  readOnly={isRunning}
                  autoFocus
                  onChange={(e) => {
                    setTaskName(e.target.value);
                    onTaskNameChange(e.target.value);
                  }}
                />
              </div>

              {/* Running state: show timer */}
              {isRunning ? (
                <div className="absolute inset-0 flex items-center justify-center w-full">
                  <div className="px-6 py-4 rounded-xl bg-gradient-to-b from-neutral-700/50 via-neutral-900/50 to-neutral-900/50  shadow-sm backdrop-blur-md border-none  inner-stroke-white-10-sm">
                    <div className="text-3xl font-bold text-white/90 text-center">
                      {Math.floor(remainingTime / 60)}:
                      {String(Math.floor(remainingTime % 60)).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              ) : (
                /* Not running: show timer controls */
                <div className="space-y-4 text-center w-full max-w-lg">
                  <div className="px-6 py-4 rounded-xl bg-gradient-to-b from-neutral-700/50 via-neutral-900/50 to-neutral-900/50  shadow-sm backdrop-blur-md border-none inner-stroke-white-10-sm">
                    <div className="text-white/80 text-lg font-medium mb-2">
                      Set your timer
                    </div>
                    <div className="flex gap-2 justify-center mb-3">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => {
                            setDuration(mins * 60);
                            setSelectedDuration(mins);
                          }}
                          className={`
                            px-4 py-1.5 rounded-lg text-sm font-medium text-white/90 
                            inner-stroke-white-10-sm
                            bg-gradient-to-t from-neutral-500/50 to-neutral-400/50 hover:bg-neutral-800/35
                            transition-all 
                            ${selectedDuration === mins ? "bg-black/60 inner-stroke-white-20-lg" : ""}
                          `}
                        >
                          {mins === 60 ? "1 hr" : `${mins} min`}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="300"
                      max="7200"
                      step="300"
                      value={duration}
                      onChange={(e) => {
                        setDuration(Number(e.target.value));
                        setSelectedDuration(null);
                      }}
                      className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-white/90 text-xs text-center mt-1">
                      {duration < 60
                        ? `${duration} seconds`
                        : `${Math.floor(duration / 60)} minutes`}
                    </div>
                  </div>

                  <Button
                    className={`
                     px-6 py-6 rounded-full w-full
    bg-neutral-800/50
    before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:rounded-full
    backdrop-blur-md 
    hover:bg-neutral-800/60
    text-white/85 text-md 
    inner-stroke-white-10-sm
    border-none
    transition-all
                    `}
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
                  >
                    Start focus session
                  </Button>
                </div>
              )}
            </div>

            {/* Secret end session button */}
            {isRunning && (
              <button
                onClick={() => {
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                  }
                  setIsRunning(false);
                  showEndMessage();
                  onSessionComplete();
                }}
                className="absolute bottom-4 right-4 w-4 h-4 rounded-lg opacity-0 hover:opacity-100 hover:bg-white/20 transition-all duration-200"
              />
            )}

            {/* PiP button in bottom center */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                variant="secondary"
                className="bg-white/60 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm"
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
