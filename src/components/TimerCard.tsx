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
  const [sessionData, setSessionData] = useState<{
    screenshots: string[];
    webcamPhotos: string[];
  }>({ screenshots: [], webcamPhotos: [] });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const captureCountRef = useRef({ screenshots: 0, webcam: 0 });

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

  const handleStart = () => {
    setIsRunning(true);
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
