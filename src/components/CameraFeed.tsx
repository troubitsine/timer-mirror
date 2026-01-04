import React, { useCallback, useEffect, useRef, useState } from "react";
import TaskNameInput from "./TaskNameInput";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogContent } from "./ui/alert-dialog";
import { Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePictureInPicture } from "@/lib/usePictureInPicture";
import { captureScreenshot, captureWebcam } from "@/lib/mediaCapture";
import { isMobileDevice } from "@/lib/deviceDetection";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

interface CameraFeedProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  width?: number | string;
  height?: number | string;
  onStart?: (duration: number) => void;
  onTaskNameChange?: (name: string) => void;
  onSessionComplete?: (
    capturedMedia?: Array<{ screenshot: string; webcamPhoto: string }>,
  ) => void;
  isMobile?: boolean;
  skipInitialCameraRequest?: boolean;
}

const DURATION_TRACK_THROTTLE_MS = 1000;

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
      skipInitialCameraRequest = false,
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
    const [showPermissionDialog, setShowPermissionDialog] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const [taskName, setTaskName] = useState("");
    const [duration, setDuration] = useState(25 * 60); // Store duration in seconds
    const [pendingStream, setPendingStream] = useState<MediaStream | null>(
      null,
    );
    const timerRef = useRef<NodeJS.Timeout>();
    const lastTaskNameRef = useRef<string>("");
    const lastDurationTrackRef = useRef(0);
    const latestPendingStreamRef = useRef<MediaStream | null>(null);
    const handleTaskNameChange = useCallback(
      (value: string) => {
        setTaskName(value);
        onTaskNameChange(value);
      },
      [onTaskNameChange],
    );
    const trackTaskName = useCallback(
      (value: string, source: "blur" | "start") => {
        const trimmedValue = value.trim();
        if (source === "blur" && trimmedValue === lastTaskNameRef.current) {
          return;
        }

        lastTaskNameRef.current = trimmedValue;
        const eventName =
          source === "start"
            ? ANALYTICS_EVENTS.TASK_NAME_START
            : ANALYTICS_EVENTS.TASK_NAME_BLUR;
        trackEvent(eventName, {
          taskName: trimmedValue,
          taskNameLength: trimmedValue.length,
          source,
        });
      },
      [],
    );
    const trackDurationChange = useCallback(
      (seconds: number) => {
        const now = Date.now();
        if (now - lastDurationTrackRef.current < DURATION_TRACK_THROTTLE_MS) {
          return;
        }
        lastDurationTrackRef.current = now;
        trackEvent(ANALYTICS_EVENTS.TIMER_DURATION_SLIDER, {
          seconds,
          isMobile,
        });
      },
      [isMobile],
    );
    const reportCameraPermission = useCallback(
      (
        status: "request" | "granted" | "denied" | "error",
        source: string,
        errorName?: string,
      ) => {
        const payload = {
          source,
          errorName,
        };

        if (status === "request") {
          trackEvent(ANALYTICS_EVENTS.CAMERA_PERMISSION_REQUEST, payload);
        } else if (status === "granted") {
          trackEvent(ANALYTICS_EVENTS.CAMERA_PERMISSION_GRANTED, payload);
        } else if (status === "denied") {
          trackEvent(ANALYTICS_EVENTS.CAMERA_PERMISSION_DENIED, payload);
        } else {
          trackEvent(ANALYTICS_EVENTS.CAMERA_PERMISSION_ERROR, payload);
        }
      },
      [],
    );

    // Use the PiP hook
    const { enterPiP, showEndMessage } = usePictureInPicture({
      videoRef,
      taskName,
      remainingTime,
      onSessionComplete,
    });

    const startCamera = async ({
      source = "manual",
      showAlertOnDeny = true,
    }: {
      source?: string;
      showAlertOnDeny?: boolean;
    } = {}) => {
      reportCameraPermission("request", source);
      try {
        const constraints = {
          video: {
            facingMode: "user", // Use front camera on mobile devices
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        // Show the permission dialog
        setShowPermissionDialog(true);

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Camera stream obtained successfully");

        // 1️⃣ Set permission state first to trigger video element rendering
        setHasPermission(true);
        setShowPermissionDialog(false);
        setPendingStream(stream);
        onPermissionGranted();
        reportCameraPermission("granted", source);
        console.log("Camera started successfully, permission dialog hidden");
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
        setShowPermissionDialog(false);
        onPermissionDenied();

        const errorName =
          err && typeof err === "object" && "name" in err
            ? String((err as { name?: string }).name)
            : "camera_error";
        const isPermissionDenied =
          errorName === "NotAllowedError" ||
          errorName === "PermissionDeniedError";
        reportCameraPermission(
          isPermissionDenied ? "denied" : "error",
          source,
          errorName,
        );

        // If permission is denied, guide the user to reset permissions
        if (showAlertOnDeny && isPermissionDenied) {
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

    useEffect(() => {
      latestPendingStreamRef.current = pendingStream;
    }, [pendingStream]);

    // Handle stream attachment when video element becomes available
    useEffect(() => {
      const videoElement = videoRef.current;
      if (pendingStream && videoElement && !videoElement.srcObject) {
        console.log("Attaching pending stream to video element");
        videoElement.srcObject = pendingStream;
        setPendingStream(null);
      }
    }, [pendingStream, hasPermission, videoRef]);

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
        setShowPermissionDialog(false);
        return;
      }

      // Only request camera permissions if not skipping initial request
      if (!skipInitialCameraRequest) {
        console.log("Requesting initial camera permissions...");

        // Show the permission dialog first
        setShowPermissionDialog(true);
        reportCameraPermission("request", "initial");

        // Request camera permissions
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: "user", // Use front camera on mobile devices
            },
          })
          .then((stream) => {
            console.log("Initial camera permission granted, updating state...");

            // 1️⃣ Set permission state first to trigger video element rendering
            setHasPermission(true);
            setShowPermissionDialog(false);
            setPendingStream(stream);
            onPermissionGranted();
            reportCameraPermission("granted", "initial");
            console.log(
              "States updated: hasPermission=true, showPermissionDialog=false",
            );
          })
          .catch((err) => {
            console.error("Initial camera permission denied:", err);
            setHasPermission(false);
            setShowPermissionDialog(false);
            onPermissionDenied();
            const errorName =
              err && typeof err === "object" && "name" in err
                ? String((err as { name?: string }).name)
                : "camera_error";
            const isPermissionDenied =
              errorName === "NotAllowedError" ||
              errorName === "PermissionDeniedError";
            reportCameraPermission(
              isPermissionDenied ? "denied" : "error",
              "initial",
              errorName,
            );
          });
      } else {
        console.log("Skipping initial camera request");
        // If we're skipping the initial request, make sure dialog is hidden
        setShowPermissionDialog(false);
      }

      // Cleanup function
      const videoElement = videoRef.current;
      return () => {
        const activePending = latestPendingStreamRef.current;
        if (videoElement?.srcObject) {
          const tracks = (videoElement.srcObject as MediaStream).getTracks();
          tracks.forEach((track) => track.stop());
        }
        if (activePending) {
          activePending.getTracks().forEach((track) => track.stop());
        }
      };
    }, [
      skipInitialCameraRequest,
      onPermissionGranted,
      onPermissionDenied,
      reportCameraPermission,
      videoRef,
    ]);

    // Predefined duration options - adjust for mobile
    const durationOptions = isMobile
      ? [5, 15, 30, 45] // Shorter options for mobile
      : [15, 30, 45, 60];

    // Extract camera permission request logic into a separate function
    const handleCameraRequest = async () => {
      console.log("Camera permission request initiated");

      // Check permission status first if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          console.log(
            "Current camera permission status:",
            permissionStatus.state,
          );

          if (permissionStatus.state === "denied") {
            alert(
              "Camera permission is blocked. Please reset permissions in your browser settings and refresh the page.",
            );
            reportCameraPermission("denied", "manual_check", "denied");
            return false;
          }

          // If permission is already granted, update state directly
          if (permissionStatus.state === "granted") {
            reportCameraPermission("request", "manual_check");
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: "user",
                },
              });

              // Set permission state first, then handle stream attachment
              setHasPermission(true);
              setPendingStream(stream);
              onPermissionGranted();
              reportCameraPermission("granted", "manual_check");
              return true;
            } catch (err) {
              console.error("Error accessing camera despite permission:", err);
              const errorName =
                err && typeof err === "object" && "name" in err
                  ? String((err as { name?: string }).name)
                  : "camera_error";
              reportCameraPermission("error", "manual_check", errorName);
            }
          }
        } catch (err) {
          console.error("Error checking permission status:", err);
          reportCameraPermission(
            "error",
            "manual_check",
            err instanceof Error ? err.name : "permissions_query_failed",
          );
        }
      }

      // Try to start the camera
      try {
        await startCamera({ source: "manual", showAlertOnDeny: true });
        return true;
      } catch (err) {
        console.error("Error starting camera:", err);
        return false;
      }
    };

    return (
      <Card className="w-full h-full bg-background relative border-none inner-stroke-black-10-sm overflow-hidden shadow-sm rounded-lg">
        <div className="relative w-full h-full overflow-hidden">
          {/* Camera feed - only show if permission granted */}
          {hasPermission && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover [transform:rotateY(180deg)]"
              style={{ width, height }}
            />
          )}

          {/* No camera permission overlay */}
          {!hasPermission && (
            <div className="absolute inset-0 bg-neutral-500/50 flex items-center justify-center"></div>
          )}

          <div className="absolute inset-0 flex flex-col items-center bg-black/20">
            {isRunning ? (
              <div className="w-full flex flex-col items-center pt-4 sm:pt-6 mb-2 sm:mb-4">
                <TaskNameInput
                  value={taskName}
                  readOnly
                  isRunning={true}
                  onChange={handleTaskNameChange}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 md:gap-3 p-3 sm:p-6 mb-4 sm:mb-12 w-full">
                <TaskNameInput
                  value={taskName}
                  autoFocus={hasPermission}
                  isRunning={false}
                  onChange={handleTaskNameChange}
                  onBlur={(value) => trackTaskName(value, "blur")}
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
                            trackEvent(ANALYTICS_EVENTS.TIMER_DURATION_PRESET, {
                              minutes: mins,
                              isMobile,
                            });
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
                        const nextDuration = Number(e.target.value);
                        setDuration(nextDuration);
                        setSelectedDuration(null);
                        trackDurationChange(nextDuration);
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
                    onClick={async () => {
                      const normalizedTaskName = taskName.trim();
                      trackEvent(ANALYTICS_EVENTS.TIMER_START_CLICK, {
                        durationMinutes: duration / 60,
                        hasPermission: hasPermission ?? null,
                        taskName: normalizedTaskName,
                        taskNameLength: normalizedTaskName.length,
                      });

                      if (!hasPermission) {
                        // Request camera permission if not granted
                        const permissionGranted = await handleCameraRequest();
                        if (!permissionGranted) return;
                      }

                      // Only start the session if we have camera permission
                      if (hasPermission) {
                        setIsRunning(true);
                        setRemainingTime(duration);
                        onStart(duration / 60);
                        trackTaskName(taskName, "start");
                        trackEvent(ANALYTICS_EVENTS.TIMER_SESSION_START, {
                          durationMinutes: duration / 60,
                          taskName: normalizedTaskName,
                          taskNameLength: normalizedTaskName.length,
                        });

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
                      }
                    }}
                  >
                    {hasPermission
                      ? "Start focus session"
                      : "Enable camera permission to get started"}
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
                onClick={async () => {
                  trackEvent(ANALYTICS_EVENTS.SECRET_END_SESSION, {
                    remainingSeconds: remainingTime,
                  });
                  // Capture at least 3 photos before ending
                  const capturePromises = [];
                  // Use user-agent based detection to avoid treating small desktop windows as mobile
                  const isMobile = isMobileDevice();

                  for (let i = 0; i < 3; i++) {
                    if (isMobile) {
                      // On mobile, only capture webcam
                      capturePromises.push(
                        new Promise((resolve) => {
                          setTimeout(async () => {
                            try {
                              const webcamPhoto = await captureWebcam(
                                videoRef.current,
                              );
                              resolve({ screenshot: "", webcamPhoto });
                            } catch (err) {
                              console.error("Error capturing webcam:", err);
                              resolve({ screenshot: "", webcamPhoto: "" });
                            }
                          }, i * 300); // Capture every 300ms
                        }),
                      );
                    } else {
                      // On desktop, capture both screen and webcam
                      capturePromises.push(
                        new Promise((resolve) => {
                          setTimeout(async () => {
                            try {
                              const screenshot = await captureScreenshot();
                              const webcamPhoto = await captureWebcam(
                                videoRef.current,
                              );
                              resolve({ screenshot, webcamPhoto });
                            } catch (err) {
                              console.error("Error capturing media:", err);
                              resolve({ screenshot: "", webcamPhoto: "" });
                            }
                          }, i * 300); // Capture every 300ms
                        }),
                      );
                    }
                  }

                  // Wait for all captures to complete
                  const results = await Promise.all(capturePromises);

                  // Stop the timer
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                  }
                  setIsRunning(false);

                  // Show end message in the PiP window
                  showEndMessage();

                  // Complete the session with the captured photos
                  onSessionComplete(results);
                }}
                className="absolute bottom-4 right-4 w-4 h-4 rounded-lg opacity-0 hover:opacity-100 hover:bg-white/20 transition-all duration-200"
              />

              {/* Secret button to reduce time to 1 minute */}
              <button
                onClick={() => {
                  trackEvent(ANALYTICS_EVENTS.SECRET_ONE_MINUTE, {
                    remainingSeconds: remainingTime,
                  });
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

          {/* PiP button - only show on desktop when camera permission is granted */}
          {!isMobile && hasPermission && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                variant="secondary"
                className="bg-white/60 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/75 backdrop-blur-md flex items-center gap-2 rounded-full inner-stroke-white-20-sm"
                onClick={() => {
                  trackEvent(ANALYTICS_EVENTS.PIP_OPEN, {
                    width: 400,
                    height: 300,
                  });
                  enterPiP({ width: 400, height: 300 });
                }}
              >
                <Maximize2 className="h-4 w-4" />
                Open floating window
              </Button>
            </div>
          )}
        </div>

        <AlertDialog open={showPermissionDialog}>
          <AnimatePresence>
            {showPermissionDialog && (
              <motion.div
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <AlertDialogContent className="p-0 border-none overflow-hidden max-w-sm bg-transparent">
                  <div
                    className="p-2 bg-neutral-700/70
                     before:absolute before:inset-0 before:bg-gradient-to-br before:from-neutral-400/40 before:to-transparent before:rounded-xl before:pointer-events-none
                     backdrop-blur-md rounded-xl"
                  >
                    <div className="flex flex-col items-center relative">
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
                        Focus Reel helps you stay focused by showing your
                        reflection as you work. Enable camera access to enhance
                        your concentration and accountability.
                      </p>
                    </div>
                  </div>
                </AlertDialogContent>
              </motion.div>
            )}
          </AnimatePresence>
        </AlertDialog>
      </Card>
    );
  },
);

export default CameraFeed;
