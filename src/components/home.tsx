import React, { useState, useRef, useEffect } from "react";
import TimerCard from "./TimerCard";
import SessionMontage from "./SessionMontage";
import { motion, AnimatePresence } from "framer-motion";

interface HomeProps {
  onSessionComplete?: () => void;
}

const Home = ({ onSessionComplete = () => {} }: HomeProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset state when component mounts
  useEffect(() => {
    setShowMontage(false);
    setSessionData({
      screenshots: [],
      webcamPhotos: [],
      taskName: "",
      duration: 0,
    });

    // Initialize camera
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Camera error:", err));
    }

    // Cleanup
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const [showMontage, setShowMontage] = useState(false);
  const [sessionData, setSessionData] = useState({
    screenshots: [],
    webcamPhotos: [],
    taskName: "",
    duration: 0,
  });

  const handleSessionStart = () => {
    setShowMontage(false);
  };

  const handleSessionEnd = (data: {
    screenshots: string[];
    webcamPhotos: string[];
    taskName: string;
    duration: number;
  }) => {
    setSessionData(data);
    setShowMontage(true);
    onSessionComplete();
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background video with overflow hidden container */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 scale-[1.1]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover [transform:rotateY(180deg)] blur-md brightness-[0.35]"
          />
        </div>
      </div>
      {/* Content overlay */}
      <div className="relative z-10 w-full min-h-screen p-8 flex items-center pb-32">
        <div className="max-w-7xl w-full mx-auto space-y-8">
          <header className="text-center space-y-2">
            <h1 className="text-4xl text-white/80 font-bold tracking-tight">
              Focus Timer
            </h1>
            <p className="text-white/70">
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
                  taskName={sessionData.taskName}
                  duration={sessionData.duration}
                  onSave={() => console.log("Saving session montage...")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Home;
