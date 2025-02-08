import React, { useState } from "react";
import TimerCard from "./TimerCard";
import SessionMontage from "./SessionMontage";
import { motion, AnimatePresence } from "framer-motion";

interface HomeProps {
  onSessionComplete?: () => void;
}

const Home = ({ onSessionComplete = () => {} }: HomeProps) => {
  const [showMontage, setShowMontage] = useState(false);
  const [sessionData, setSessionData] = useState({
    screenshots: [],
    webcamPhotos: [],
  });

  const handleSessionStart = () => {
    setShowMontage(false);
  };

  const handleSessionEnd = (data: {
    screenshots: string[];
    webcamPhotos: string[];
  }) => {
    setSessionData(data);
    setShowMontage(true);
    onSessionComplete();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-background/80 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Focus Timer</h1>
          <p className="text-muted-foreground">
            Stay focused and create a visual record of your work session
          </p>
        </header>

        <AnimatePresence mode="wait">
          {!showMontage ? (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <TimerCard
                onSessionStart={handleSessionStart}
                onSessionEnd={handleSessionEnd}
                onCameraPermissionGranted={() =>
                  console.log("Camera permission granted")
                }
                onCameraPermissionDenied={() =>
                  console.log("Camera permission denied")
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="montage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-6xl mx-auto"
            >
              <SessionMontage
                screenshots={sessionData.screenshots}
                webcamPhotos={sessionData.webcamPhotos}
                onSave={() => console.log("Saving session montage...")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Home;
