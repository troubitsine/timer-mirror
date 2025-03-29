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
}

const TimerCard = ({
  onSessionStart = () => {},
  onSessionEnd = () => {},
  onCameraPermissionGranted = () => {},
  onCameraPermissionDenied = () => {},
}: TimerCardProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
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
      captureCleanupRef.current = scheduleCaptures(
        sessionDuration,
        (screenshot, webcamPhoto) => {
          setSessionData((prev) => ({
            screenshots: [...prev.screenshots, screenshot].filter(Boolean),
            webcamPhotos: [...prev.webcamPhotos, webcamPhoto].filter(Boolean),
          }));
        },
      );
    }

    return () => {
      if (captureCleanupRef.current) {
        captureCleanupRef.current();
        captureCleanupRef.current = undefined;
      }
    };
  }, [isRunning, sessionDuration]);

  const handleStart = async (duration: number) => {
    if (!videoRef.current) {
      console.error("Video element not initialized");
      return;
    }

    // Initialize media capture (will handle mobile vs desktop differences)
    const { screenStream } = await initializeMediaCapture(videoRef.current);

    // On mobile, we don't need to check for screen stream
    if (!isMobile && !screenStream) {
      console.error("Failed to initialize screen capture");
      return;
    }

    const totalDurationSec = duration * 60;
    setSessionDuration(totalDurationSec);
    setRemainingTime(totalDurationSec);
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
        />
      </div>
    </Card>
  );
};

export default TimerCard;
