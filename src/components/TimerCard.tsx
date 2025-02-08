import React, { useState, useRef, useEffect } from "react";
import { initializeMediaCapture, scheduleCaptures } from "@/lib/mediaCapture";
import { Card } from "./ui/card";
import CameraFeed from "./CameraFeed";
import TimerControls from "./TimerControls";

interface TimerCardProps {
  onSessionStart?: () => void;
  onSessionEnd?: () => void;
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
  const timerRef = useRef<NodeJS.Timeout>();
  const captureCleanupRef = useRef<(() => void) | undefined>();

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            const finalData = sessionData;
            setTimeout(() => {
              setIsRunning(false);
              onSessionEnd(finalData);
            }, 3000); // Give time for the end message to show
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, remainingTime, sessionData, onSessionEnd]);

  // Capture scheduling effect
  useEffect(() => {
    if (isRunning && sessionDuration > 0) {
      captureCleanupRef.current = scheduleCaptures(
        sessionDuration,
        (screenshot, webcamPhoto) => {
          setSessionData((prev) => ({
            screenshots: [...prev.screenshots, screenshot],
            webcamPhotos: [...prev.webcamPhotos, webcamPhoto],
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

    const { screenStream } = await initializeMediaCapture(videoRef.current);
    if (!screenStream) {
      console.error("Failed to initialize screen capture");
      return;
    }

    const totalDurationSec = duration * 60;
    setSessionDuration(totalDurationSec);
    setRemainingTime(totalDurationSec);
    setSessionData({ screenshots: [], webcamPhotos: [] });
    onSessionStart();
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (captureCleanupRef.current) {
      captureCleanupRef.current();
      captureCleanupRef.current = undefined;
    }
    onSessionEnd(sessionData);
  };

  return (
    <Card className="w-[800px] bg-background p-6 space-y-6 shadow-xl rounded-xl">
      <div className="w-full h-[400px]">
        <CameraFeed
          ref={videoRef}
          onPermissionGranted={onCameraPermissionGranted}
          onPermissionDenied={onCameraPermissionDenied}
          onTaskNameChange={setTaskName}
          width={800}
          height={400}
          isRunning={isRunning}
          remainingTime={remainingTime}
          taskName={taskName}
        />
      </div>

      <div className="w-full">
        <TimerControls
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          isRunning={isRunning}
          onTaskNameChange={setTaskName}
          onDurationChange={(duration) =>
            console.log("Duration changed:", duration)
          }
        />
      </div>
    </Card>
  );
};

export default TimerCard;
