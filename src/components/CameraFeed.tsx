import React, { useEffect, useRef, useState } from "react";
import TaskNameInput from "./TaskNameInput";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogContent } from "./ui/alert-dialog";
import { CameraOff, Maximize2 } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import { usePictureInPicture } from "@/lib/usePictureInPicture";

interface CameraFeedProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  width?: number | string;
  height?: number | string;
  onStart?: (duration: number) => void;
  onTaskNameChange?: (name: string) => void;
  onSessionComplete?: () => void;
  isMobile?: boolean;
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
      isMobile = false,
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
    const [isRunning, setIsRunning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [taskName, setTaskName] = useState("");
    const [duration, setDuration] = useState(25 * 60); // Store duration in seconds
    const timerRef = useRef<NodeJS.Timeout>();

    // Use the PiP hook
    const { enterPiP, showEndMessage } = usePictureInPicture({
      videoRef,
      taskName,
      remainingTime,
      onSessionComplete,
    });

    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: "user", // Use front camera on mobile devices
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        // Show the permission dialog again
        setShowPermissionDialog(true);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          onPermissionGranted();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
        onPermissionDenied();

        // If permission is denied, guide the user to reset permissions
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          alert(
            "Camera access was denied. Please reset permissions in your browser settings and try again.",
          );
        }
      }
    };

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
        // Show end message in the PiP window
        showEndMessage();
        // Immediately complete the session without delay
        onSessionComplete();
      }
    }, [remainingTime, isRunning, showEndMessage, onSessionComplete]);

    useEffect(() => {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasPermission(false);
        return;
      }

      // Request camera permissions
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "user", // Use front camera on mobile devices
          },
        })
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
      };
    }, []);

    // Predefined duration options - adjust for mobile
    const durationOptions = isMobile
      ? [5, 15, 30, 45] // Shorter options for mobile
      : [15, 30, 45, 60];

    return (
      <Card className="w-full h-full bg-background relative border-none inner-stroke-black-10-sm overflow-hidden shadow-sm rounded-lg">
        {hasPermission ? (
          <div className="relative w-full h-full overflow-hidden">
            {/* Camera feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover [transform:rotateY(180deg)]"
              style={{ width, height }}
            />

            <div className="absolute inset-0 flex flex-col items-center bg-black/20">
              {isRunning ? (
                <div className="w-full flex flex-col items-center pt-4 sm:pt-6 mb-2 sm:mb-4">
                  <TaskNameInput
                    value={taskName}
                    readOnly
                    isRunning={true}
                    onChange={(value) => {
                      setTaskName(value);
                      onTaskNameChange(value);
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 md:gap-3 p-3 sm:p-6 mb-4 sm:mb-12 w-full">
                  <TaskNameInput
                    value={taskName}
                    autoFocus
                    isRunning={false}
                    onChange={(value) => {
                      setTaskName(value);
                      onTaskNameChange(value);
                    }}
                  />
                  <div className="w-full max-w-lg mx-auto space-y-1 md:space-y-3 sm:px-0">
                    <div className="px-3 sm:px-6 py-3 sm:py-3 rounded-xl bg-gradient-to-b from-neutral-700/50 via-neutral-900/50 to-neutral-900/50 shadow-sm backdrop-blur-md border-none inner-stroke-white-10-sm">
                      <div className="text-white/80 text-base sm:text-lg text-center font-medium mb-2">
                        Set your timer
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mb-3">
                        {durationOptions.map((mins) => (
                          <button
                            key={mins}
                            onClick={() => {
                              setDuration(mins * 60);
                              setSelectedDuration(mins);
                            }}
                            className={`
                            px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium text-white/90 
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
                        min={isMobile ? "60" : "300"} // 1 minute minimum on mobile, 5 minutes on desktop
                        max={isMobile ? "3600" : "7200"} // 1 hour max on mobile, 2 hours on desktop
                        step={isMobile ? "60" : "300"} // 1 minute steps on mobile, 5 minute steps on desktop
                        value={duration}
                        onChange={(e) => {
                          setDuration(Number(e.target.value));
                          setSelectedDuration(null);
                        }}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="text-white/90 text-xs text-center mt-1 mb-1">
                        {duration < 60
                          ? `${duration} seconds`
                          : `${Math.floor(duration / 60)} minutes`}
                      </div>
                    </div>

                    <Button
                      className={`
                     px-6 py-5 sm:py-6 rounded-full w-full
                     bg-neutral-800/50
                     before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/10 before:to-transparent before:rounded-full
                     backdrop-blur-md 
                     hover:bg-neutral-800/60
                     text-white/85 text-sm sm:text-md 
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
                </div>
              )}

              {/* Running state: show timer */}
              {isRunning && (
                <div className="absolute inset-0 flex items-center justify-center w-full">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-gradient-to-b from-neutral-700/50 via-neutral-900/50 to-neutral-900/50 shadow-sm backdrop-blur-md border-none inner-stroke-white-10-sm">
                    <div className="text-2xl sm:text-3xl font-bold text-white/90 text-center">
                      {Math.floor(remainingTime / 60)}:
                      {String(Math.floor(remainingTime % 60)).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Secret buttons */}
            {isRunning && (
              <>
                {/* Secret end session button */}
                <button
                  onClick={() => {
                    if (timerRef.current) {
                      clearInterval(timerRef.current);
                    }
                    setIsRunning(false);
                    // Show end message in the PiP window
                    showEndMessage();
                    // Immediately complete the session without delay
                    onSessionComplete();
                  }}
                  className="absolute bottom-4 right-4 w-4 h-4 rounded-lg opacity-0 hover:opacity-100 hover:bg-white/20 transition-all duration-200"
                />

                {/* Secret button to reduce time to 1 minute */}
                <button
                  onClick={() => {
                    // Set remaining time to 60 seconds (1 minute)
                    setRemainingTime(60);

                    // Clear the existing interval
                    if (timerRef.current) {
                      clearInterval(timerRef.current);
                    }

                    // Create a new interval that counts down from 60 seconds
                    const startTime = Date.now();
                    timerRef.current = setInterval(() => {
                      const elapsedSeconds = Math.floor(
                        (Date.now() - startTime) / 1000,
                      );
                      const newRemainingTime = Math.max(0, 60 - elapsedSeconds);

                      setRemainingTime(newRemainingTime);
                      if (newRemainingTime <= 0) {
                        clearInterval(timerRef.current);
                      }
                    }, 1000);
                  }}
                  className="absolute bottom-4 left-4 w-4 h-4 rounded-lg opacity-0 hover:opacity-100 hover:bg-white/20 transition-all duration-200"
                />
              </>
            )}

            {/* PiP button - only show on desktop */}
            {!isMobile && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  variant="secondary"
                  className="bg-white/60 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm"
                  onClick={() => enterPiP({ width: 400, height: 300 })}
                >
                  <Maximize2 className="h-4 w-4" />
                  Open floating window
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full space-y-4 bg-muted rounded-lg">
            <CameraOff className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Camera access is required</p>
            <Button
              onClick={() => {
                // Try to start the camera
                startCamera();

                // If the browser has a permissions API, suggest using it
                if (navigator.permissions && navigator.permissions.query) {
                  navigator.permissions
                    .query({ name: "camera" as PermissionName })
                    .then((permissionStatus) => {
                      if (permissionStatus.state === "denied") {
                        alert(
                          "Camera permission is blocked. Please reset permissions in your browser settings and refresh the page.",
                        );
                      }
                    })
                    .catch((err) =>
                      console.error("Error checking permission status:", err),
                    );
                }
              }}
            >
              Enable Camera
            </Button>
          </div>
        )}

        <AlertDialog open={!hasPermission && showPermissionDialog}>
          <AlertDialogContent className="p-0 border-none overflow-hidden max-w-sm bg-transparent">
            <div
              className="p-2 bg-neutral-700/70
               before:absolute before:inset-0 before:bg-gradient-to-br before:from-neutral-400/40 before:to-transparent before:rounded-xl before:pointer-events-none
               backdrop-blur-md rounded-xl"
            >
              <div className="flex flex-col items-center relative">
                <div className="absolute right-0 top-0">
                  <motion.div
                    layout
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  >
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowPermissionDialog(false)}
                        className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm p-2"
                      >
                        <Cross2Icon className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>

                <div className="w-full max-w-[180px] flex h-24 justify-center items-center">
                  <img
                    src="/onboarding/step-1-illustration.png"
                    alt="Camera permission"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <h2 className="text-lg font-semibold text-white/85 mb-1 text-center">
                  Focus Reel requires camera permissions
                </h2>

                <p className="text-white/75 text-sm mb-4 text-balance mx-auto text-center">
                  Focus Reel helps you stay focused by showing your reflection
                  as you work. Enable camera access to enhance your
                  concentration and accountability.
                </p>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  },
);

export default CameraFeed;
