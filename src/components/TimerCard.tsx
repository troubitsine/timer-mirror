import React, { useState, useRef, useEffect } from "react";
import { initializeMediaCapture, scheduleCaptures } from "@/lib/mediaCapture";
import { Card } from "./ui/card";
import CameraFeed from "./CameraFeed";
import { isMobileDevice } from "@/lib/deviceDetection";

interface TimerCardProps {
  onSessionStart?: () => void;
  onSessionEnd?: (
    data: {
      screenshots: string[];
      webcamPhotos: string[];
      taskName: string;
      duration: number;
    },
    capturedMedia?: Array<{ screenshot: string; webcamPhoto: string }>,
  ) => void;
  onCameraPermissionGranted?: () => void;
  onCameraPermissionDenied?: () => void;
  skipInitialCameraRequest?: boolean;
}

const TimerCard = ({
  onSessionStart = () => {},
  onSessionEnd = () => {},
  onCameraPermissionGranted = () => {},
  onCameraPermissionDenied = () => {},
  skipInitialCameraRequest = false,
}: TimerCardProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [taskName, setTaskName] = useState("");
  const [sessionData, setSessionData] = useState<{
    screenshots: string[];
    webcamPhotos: string[];
  }>({ screenshots: [], webcamPhotos: [] });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCleanupRef = useRef<(() => void) | undefined>();
  const isMobile = isMobileDevice();

  // Capture scheduling effect
  useEffect(() => {
    if (isRunning && sessionDuration > 0) {
      console.log(
        "⏱️ TimerCard: scheduleCaptures called with duration",
        sessionDuration,
      );
      captureCleanupRef.current = scheduleCaptures(
        sessionDuration,
        (screenshot, webcamPhoto) => {
          console.log("📸 TimerCard: capture callback received", {
            hasScreenshot: !!screenshot,
            screenshotLength: screenshot?.length || 0,
            hasWebcamPhoto: !!webcamPhoto,
            webcamPhotoLength: webcamPhoto?.length || 0,
          });

          setSessionData((prev) => {
            const newScreenshots = [...prev.screenshots];
            if (screenshot && screenshot.length > 100) {
              console.log("✅ Adding valid screenshot to session data");
              newScreenshots.push(screenshot);
            } else if (screenshot) {
              console.warn(
                "⚠️ Screenshot too small, not adding to session data",
              );
            } else {
              console.log("ℹ️ No screenshot provided to callback");
            }

            const newWebcamPhotos = [...prev.webcamPhotos];
            if (webcamPhoto && webcamPhoto.length > 100) {
              newWebcamPhotos.push(webcamPhoto);
            }

            console.log("📊 TimerCard: updated session data", {
              screenshotsCount: newScreenshots.length,
              webcamPhotosCount: newWebcamPhotos.length,
            });

            return {
              screenshots: newScreenshots,
              webcamPhotos: newWebcamPhotos,
            };
          });
        },
      );
    }

    return () => {
      if (captureCleanupRef.current) {
        console.log("🧹 TimerCard: cleaning up capture scheduler");
        captureCleanupRef.current();
        captureCleanupRef.current = undefined;
      }
    };
  }, [isRunning, sessionDuration]);

  const handleStart = async (duration: number) => {
    console.log("▶️ TimerCard: handleStart called with duration", duration);

    if (!videoRef.current) {
      console.error("❌ TimerCard: Video element not initialized");
      return;
    }

    console.log("🎥 TimerCard: Video element status before initialization", {
      readyState: videoRef.current.readyState,
      videoWidth: videoRef.current.videoWidth,
      videoHeight: videoRef.current.videoHeight,
      srcObject: !!videoRef.current.srcObject,
    });

    // Initialize media capture (will handle mobile vs desktop differences)
    const { screenStream } = await initializeMediaCapture(videoRef.current);

    // Log whether screen capture was successful
    if (screenStream) {
      console.log("✅ TimerCard: Screen capture initialized successfully", {
        active: screenStream.active,
        tracks: screenStream.getTracks().length,
        trackSettings: screenStream.getVideoTracks()[0]?.getSettings(),
      });
    } else if (!isMobile) {
      console.log(
        "⚠️ TimerCard: Screen capture failed or was denied, continuing with webcam only",
      );
    }

    // Continue with the session regardless of screen capture status
    // This allows the app to work even if screen capture permission is denied
    const totalDurationSec = duration * 60;
    setSessionDuration(totalDurationSec);
    setSessionData({ screenshots: [], webcamPhotos: [] });
    setIsRunning(true);
    onSessionStart();
  };

  const handleSessionComplete = (
    capturedMedia?: Array<{ screenshot: string; webcamPhoto: string }>,
  ) => {
    if (captureCleanupRef.current) {
      captureCleanupRef.current();
      captureCleanupRef.current = undefined;
    }
    setIsRunning(false);
    onSessionEnd(
      {
        ...sessionData,
        taskName,
        duration: Math.round(sessionDuration / 60),
      },
      capturedMedia,
    );
  };

  return (
    <Card className="w-[calc(100%-20px)] lg:w-[65vw] min-w-[300px] max-w-[1800px] inner-stroke-white-5-sm border-none bg-white/20 p-2 space-y-6 shadow-xl rounded-xl">
      <div className="w-full h-[65vh] sm:aspect-video">
        <CameraFeed
          ref={videoRef}
          onPermissionGranted={onCameraPermissionGranted}
          onPermissionDenied={onCameraPermissionDenied}
          onTaskNameChange={setTaskName}
          width="100%"
          height="100%"
          onStart={handleStart}
          onSessionComplete={handleSessionComplete}
          isMobile={isMobile}
          skipInitialCameraRequest={skipInitialCameraRequest}
        />
      </div>
    </Card>
  );
};

export default TimerCard;
