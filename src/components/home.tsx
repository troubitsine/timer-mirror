import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TimerCard from "./TimerCard";
import SessionMontage from "./SessionMontage";
import OnboardingCard from "./OnboardingCard";
import { motion, AnimatePresence } from "framer-motion";
import { isMobileDevice } from "@/lib/deviceDetection";

interface HomeProps {
  onSessionComplete?: () => void;
}

const Home = ({ onSessionComplete = () => {} }: HomeProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = isMobileDevice();

  // Reset state when component mounts
  useEffect(() => {
    setShowMontage(false);
    setSessionData({
      screenshots: [],
      webcamPhotos: [],
      taskName: "",
      duration: 0,
    });

    // Read the collapsed state from localStorage once on mount
    const savedCollapsedState =
      localStorage.getItem("onboardingCollapsed") === "true";

    // Initialize camera
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: "user", // Use front camera on mobile devices
          },
        })
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
  const [hasCameraPermission, setHasCameraPermission] = useState(false);

  const handleSessionStart = () => {
    setShowMontage(false);
  };

  const navigate = useNavigate();

  const handleSessionEnd = (
    data: {
      screenshots: string[];
      webcamPhotos: string[];
      taskName: string;
      duration: number;
    },
    capturedMedia?: Array<{ screenshot: string; webcamPhoto: string }>,
  ) => {
    onSessionComplete();

    // If we have additional captured media, add it to the data
    if (capturedMedia && capturedMedia.length > 0) {
      const updatedData = {
        ...data,
        screenshots: [
          ...data.screenshots,
          ...capturedMedia.map((item) => item.screenshot).filter(Boolean),
        ],
        webcamPhotos: [
          ...data.webcamPhotos,
          ...capturedMedia.map((item) => item.webcamPhoto).filter(Boolean),
        ],
      };
      navigate("/complete", { state: updatedData });
    } else {
      navigate("/complete", { state: data });
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background video with overflow hidden container */}
      <div className="absolute inset-0 overflow-hidden">
        {!showMontage && (
          <>
            <div className="absolute inset-0 w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover [transform:rotateY(180deg)] brightness-[0.35]"
                style={{ position: "fixed" }}
              />
            </div>
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                backgroundColor: "rgba(0, 0, 0, 0.1)",
              }}
            />
          </>
        )}
        {showMontage && <div className="absolute inset-0 bg-stone-50" />}
      </div>
      {/* Content overlay */}
      <div className="relative z-10 w-full min-h-screen p-1 sm:p-8 flex items-center pt-6 pb-12 sm:pb-32">
        <div className="max-w-7xl w-full mx-auto space-y-4">
          {showMontage && (
            <header className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black/80">
                Focus Timer
              </h1>
              <p className="text-sm sm:text-base text-black/60">
                Stay focused and create a visual record of your work session
              </p>
            </header>
          )}

          {!showMontage && (
            <OnboardingCard
              initialCollapsed={
                localStorage.getItem("onboardingCollapsed") === "true"
              }
              hasCameraPermission={hasCameraPermission}
            />
          )}

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
                  onCameraPermissionGranted={() => {
                    setHasCameraPermission(true);
                  }}
                  onCameraPermissionDenied={() => {
                    setHasCameraPermission(false);
                  }}
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
