import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Play, Timer } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isMobileDevice } from "@/lib/deviceDetection";

interface SessionMontageProps {
  screenshots?: string[];
  webcamPhotos?: string[];
  taskName?: string;
  duration?: number;
  onSave?: () => void;
}

const SessionMontage = ({
  screenshots = [],
  webcamPhotos = [],
  taskName = "Focus Session",
  duration = 25,
  onSave = () => {},
}: SessionMontageProps) => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [showCollage, setShowCollage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStackExiting, setIsStackExiting] = useState(false);
  const isMobile = isMobileDevice();

  // For mobile, we only use webcam photos
  const allPhotos = isMobile
    ? [...webcamPhotos].filter(Boolean)
    : [...screenshots, ...webcamPhotos].filter(Boolean);

  const outerTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const innerTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (outerTimerRef.current) {
      clearTimeout(outerTimerRef.current);
      outerTimerRef.current = null;
    }
    if (innerTimerRef.current) {
      clearTimeout(innerTimerRef.current);
      innerTimerRef.current = null;
    }
  };

  const startAnimation = React.useCallback(() => {
    // First clear any existing timers
    clearTimers();

    // Reset to initial state
    setShowCollage(false);
    setIsStackExiting(false);
    setCurrentIndex(0);
    setIsPlaying(false);

    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      // Then use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        setIsPlaying(true);
      }, 50);
    });
  }, []);

  // Effect for handling animation timeouts
  useEffect(() => {
    if (!isPlaying) return;

    if (currentIndex < allPhotos.length) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
      outerTimerRef.current = timer;
    } else {
      const exitTimer = setTimeout(() => {
        setIsStackExiting(true);
        const collageTimer = setTimeout(() => {
          setShowCollage(true);
          setIsPlaying(false);
        }, 500);
        innerTimerRef.current = collageTimer;
      }, 800);
      outerTimerRef.current = exitTimer;
    }
  }, [isPlaying, currentIndex, allPhotos.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <Card className="w-full min-h-[400px] bg-background p-6 relative">
      <div className="absolute top-6 right-6">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <Timer className="h-4 w-4" />
          Start New Timer
        </Button>
      </div>
      <div className="flex flex-col h-full items-center justify-center gap-8">
        {!showCollage ? (
          <motion.div
            className="relative w-[250px] h-[180px]"
            animate={isStackExiting ? { scale: 0.8, y: 100, opacity: 0 } : {}}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              mass: 1,
            }}
          >
            {allPhotos.slice(0, currentIndex).map((photo, index) => (
              <motion.div
                key={index}
                className="absolute inset-0"
                style={{ rotate: `${Math.random() * 6 - 3}deg` }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-full h-full bg-white rounded-[14px] p-1 ring-[0.5px] ring-black/5 shadow-[rgba(21,_22,_31,_0.015)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.015)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.025)_0px_11px_24.2px_-1.75px]">
                  <img
                    src={photo}
                    alt={`Stack photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-[12px] ring-[0.5px] ring-black/5"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="w-full max-w-[400px]"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              mass: 0.8,
              bounce: 0.25,
            }}
            key="collage"
          >
            <div className="bg-white rounded-[14px] p-2 overflow-hidden ring-[0.5px] ring-black/5 shadow-[rgba(21,_22,_31,_0.06)_0px_0.662406px_1.45729px_-0.583333px,_rgba(21,_22,_31,_0.063)_0px_2.51739px_5.53825px_-1.16667px,_rgba(21,_22,_31,_0.098)_0px_11px_24.2px_-1.75px]">
              <div className="relative">
                <div
                  className="grid w-full ring-[0.5px] ring-black/5 rounded-lg overflow-hidden"
                  style={{
                    gridTemplateColumns: `repeat(${Math.ceil(
                      Math.sqrt(allPhotos.length),
                    )}, 1fr)`,
                  }}
                >
                  {allPhotos.map((photo, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={photo}
                        alt={`Collage photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-gray-900/75 backdrop-blur-sm text-white/90 px-4 py-2 rounded-lg text-sm font-medium shadow-md">
                    {taskName} • {duration}{" "}
                    {duration === 1 ? "minute" : "minutes"}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <Button variant="default" size="lg" onClick={startAnimation}>
          <Play className="h-4 w-4 mr-2" />
          {showCollage ? "Replay Animation" : "Play Animation"}
        </Button>
      </div>
    </Card>
  );
};

export default SessionMontage;
