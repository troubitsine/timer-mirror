import React, { useState } from "react";
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

  const handleStart = () => {
    setIsRunning(true);
    onSessionStart();
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    onSessionEnd();
  };

  return (
    <Card className="w-[800px] bg-background p-6 space-y-6 shadow-xl rounded-xl">
      <div className="w-full h-[400px]">
        <CameraFeed
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
