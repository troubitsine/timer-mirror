import React, { useState, useRef, useEffect } from "react";
import { captureScreenshot, captureWebcam } from "@/lib/capture";
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
  const [sessionData, setSessionData] = useState<{
    screenshots: string[];
    webcamPhotos: string[];
  }>({ screenshots: [], webcamPhotos: [] });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const captureCountRef = useRef({ screenshots: 0, webcam: 0 });

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleReset();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, remainingTime]);

  // Capture interval effect
  useEffect(() => {
    if (isRunning) {
      const captureInterval = setInterval(async () => {
        if (
          captureCountRef.current.screenshots >= 10 &&
          captureCountRef.current.webcam >= 4
        ) {
          clearInterval(captureInterval);
          return;
        }

        if (captureCountRef.current.screenshots < 10) {
          const screenshot = await captureScreenshot();
          if (screenshot) {
            setSessionData((prev) => ({
              ...prev,
              screenshots: [...prev.screenshots, screenshot],
            }));
            captureCountRef.current.screenshots++;
          }
        }

        if (captureCountRef.current.webcam < 4 && videoRef.current) {
          const webcamPhoto = await captureWebcam(videoRef.current);
          if (webcamPhoto) {
            setSessionData((prev) => ({
              ...prev,
              webcamPhotos: [...prev.webcamPhotos, webcamPhoto],
            }));
            captureCountRef.current.webcam++;
          }
        }
      }, 30000); // Capture every 30 seconds

      timerRef.current = captureInterval;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = (duration: number) => {
    setIsRunning(true);
    setRemainingTime(duration * 60);
    setSessionData({ screenshots: [], webcamPhotos: [] });
    captureCountRef.current = { screenshots: 0, webcam: 0 };
    onSessionStart();
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    onSessionEnd(sessionData);
  };

  return (
    <Card className="w-[800px] bg-background p-6 space-y-6 shadow-xl rounded-xl">
      <div className="w-full h-[400px]">
        <CameraFeed
          ref={videoRef}
          onPermissionGranted={onCameraPermissionGranted}
          onPermissionDenied={onCameraPermissionDenied}
          width={800}
          height={400}
          isRunning={isRunning}
          remainingTime={remainingTime}
        />
      </div>

      <div className="w-full">
        <TimerControls
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          isRunning={isRunning}
          onTaskNameChange={(name) => console.log("Task name changed:", name)}
          onDurationChange={(duration) =>
            console.log("Duration changed:", duration)
          }
        />
      </div>
    </Card>
  );
};

export default TimerCard;
